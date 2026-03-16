'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { z } from 'zod'
import type { AppointmentStatus } from '@/types/database'

const appointmentSchema = z.object({
  patient_id: z.string().uuid(),
  doctor_id: z.string().uuid().optional().or(z.literal('')),
  department_id: z.string().uuid().optional().or(z.literal('')),
  scheduled_at: z.string().min(1, 'Schedule date and time is required'),
  duration_minutes: z.coerce.number().int().min(5).max(480).default(30),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
})

export type AppointmentState = { error?: string; fieldErrors?: Record<string, string[]> } | null

export async function createAppointmentAction(
  _prev: AppointmentState,
  formData: FormData
): Promise<AppointmentState> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id!

  const parsed = appointmentSchema.safeParse({
    patient_id: formData.get('patient_id'),
    doctor_id: (formData.get('doctor_id') as string) || undefined,
    department_id: (formData.get('department_id') as string) || undefined,
    scheduled_at: formData.get('scheduled_at'),
    duration_minutes: formData.get('duration_minutes') || '30',
    reason: (formData.get('reason') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()
  const { data: appt, error } = await supabase
    .from('appointments')
    .insert({
      hospital_id: hospitalId,
      patient_id: parsed.data.patient_id,
      doctor_id: parsed.data.doctor_id || null,
      department_id: parsed.data.department_id || null,
      scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
      duration_minutes: parsed.data.duration_minutes,
      reason: parsed.data.reason ?? null,
      notes: parsed.data.notes ?? null,
      created_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) return { error: 'Failed to create appointment.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'APPOINTMENT_CREATED',
    description: `Appointment created for patient ${parsed.data.patient_id}`,
    metadata: { appointmentId: appt.id },
  })

  revalidatePath('/hospital/appointments')
  redirect('/hospital/appointments')
}

export async function updateAppointmentStatusAction(
  apptId: string,
  status: AppointmentStatus
): Promise<void> {
  const ctx = await requireAuth()
  const supabase = createSupabaseServiceClient()

  await supabase
    .from('appointments')
    .update({ status })
    .eq('id', apptId)
    .eq('hospital_id', ctx.profile.hospital_id!)

  await writeAuditLog({
    hospitalId: ctx.profile.hospital_id!,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'APPOINTMENT_UPDATED',
    description: `Appointment status changed to ${status}`,
    metadata: { appointmentId: apptId, status },
  })

  revalidatePath('/hospital/appointments')
}
