'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { requestAppointmentSchema } from '@/lib/patient/schemas'

export type AppointmentActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null

export async function requestAppointmentAction(
  _prev: AppointmentActionState,
  formData: FormData
): Promise<AppointmentActionState> {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const parsed = requestAppointmentSchema.safeParse({
    doctor_id: formData.get('doctor_id'),
    department_id: (formData.get('department_id') as string) || undefined,
    scheduled_at: formData.get('scheduled_at'),
    duration_minutes: 30,
    reason: (formData.get('reason') as string) || undefined,
  })

  if (!parsed.success) {
    return { error: 'Please fix the fields below.', fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  // Verify scheduled_at is in the future
  if (new Date(parsed.data.scheduled_at) <= new Date()) {
    return { error: 'Appointment must be scheduled in the future.' }
  }

  const supabase = createSupabaseServiceClient()

  // Verify doctor belongs to hospital
  const { data: doctor } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', parsed.data.doctor_id)
    .eq('hospital_id', hospitalId)
    .eq('role', 'DOCTOR')
    .eq('is_active', true)
    .single()

  if (!doctor) return { error: 'Selected doctor not found.' }

  const { error } = await supabase.from('appointments').insert({
    hospital_id: hospitalId,
    patient_id: ctx.patientId,
    doctor_id: parsed.data.doctor_id,
    department_id: parsed.data.department_id ?? null,
    scheduled_at: parsed.data.scheduled_at,
    duration_minutes: parsed.data.duration_minutes,
    reason: parsed.data.reason ?? null,
    status: 'SCHEDULED',
    created_by: ctx.userId,
  })

  if (error) return { error: 'Failed to book appointment. Please try again.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: ctx.patientId,
    eventType: 'APPOINTMENT_CREATED',
    description: `Patient requested appointment with doctor ${parsed.data.doctor_id}`,
    metadata: { patientId: ctx.patientId, doctorId: parsed.data.doctor_id },
  })

  revalidatePath('/patient/appointments')
  redirect('/patient/appointments')
}

export type CancelState = { status: 'success' } | { status: 'error'; error: string } | null

export async function cancelAppointmentAction(appointmentId: string): Promise<CancelState> {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = createSupabaseServiceClient()

  // Verify appointment belongs to patient and is SCHEDULED
  const { data: appt } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('id', appointmentId)
    .eq('patient_id', ctx.patientId)
    .eq('hospital_id', hospitalId)
    .eq('status', 'SCHEDULED')
    .single()

  if (!appt) return { status: 'error', error: 'Appointment not found or cannot be cancelled.' }

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'CANCELLED' })
    .eq('id', appointmentId)

  if (error) return { status: 'error', error: 'Failed to cancel appointment.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: ctx.patientId,
    eventType: 'APPOINTMENT_CANCELLED_BY_PATIENT',
    description: `Patient cancelled appointment ${appointmentId}`,
    metadata: { appointmentId },
  })

  revalidatePath('/patient/appointments')
  return { status: 'success' }
}
