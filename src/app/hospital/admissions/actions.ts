'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { z } from 'zod'

const admissionSchema = z.object({
  patient_id: z.string().uuid('Please select a patient.'),
  doctor_id: z.string().uuid().optional().or(z.literal('')),
  department_id: z.string().uuid().optional().or(z.literal('')),
  room_id: z.string().uuid().optional().or(z.literal('')),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
})

export type AdmissionState = { error?: string; fieldErrors?: Record<string, string[]> } | null

export async function createAdmissionAction(
  _prev: AdmissionState,
  formData: FormData
): Promise<AdmissionState> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id!

  const parsed = admissionSchema.safeParse({
    patient_id: formData.get('patient_id'),
    doctor_id: (formData.get('doctor_id') as string) || undefined,
    department_id: (formData.get('department_id') as string) || undefined,
    room_id: (formData.get('room_id') as string) || undefined,
    reason: (formData.get('reason') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()
  const roomId = parsed.data.room_id || null

  // If a room is selected, verify it belongs to this hospital and is available
  if (roomId) {
    const { data: room } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .eq('hospital_id', hospitalId)
      .eq('is_available', true)
      .eq('is_active', true)
      .single()
    if (!room) return { error: 'Selected room is not available.' }
  }

  // Look up room_number for bed_number field (backward compat)
  let bedNumber: string | null = null
  if (roomId) {
    const { data: roomData } = await supabase
      .from('rooms')
      .select('room_number')
      .eq('id', roomId)
      .single()
    bedNumber = roomData?.room_number ?? null
  }

  const { data: admission, error } = await supabase
    .from('admissions')
    .insert({
      hospital_id: hospitalId,
      patient_id: parsed.data.patient_id,
      doctor_id: parsed.data.doctor_id || null,
      department_id: parsed.data.department_id || null,
      room_id: roomId,
      reason: parsed.data.reason ?? null,
      notes: parsed.data.notes ?? null,
      bed_number: bedNumber,
      created_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) return { error: 'Failed to create admission.' }

  // Mark room as occupied
  if (roomId) {
    await supabase
      .from('rooms')
      .update({ is_available: false })
      .eq('id', roomId)
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'ADMISSION_CREATED',
    description: `Patient ${parsed.data.patient_id} admitted`,
    metadata: { admissionId: admission.id, roomId },
  })

  revalidatePath('/hospital/admissions')
  redirect('/hospital/admissions')
}

export async function dischargePatientAction(admissionId: string): Promise<void> {
  const ctx = await requireAuth()
  const supabase = createSupabaseServiceClient()
  const hospitalId = ctx.profile.hospital_id!

  // Get the admission to find room_id before updating
  const { data: existing } = await supabase
    .from('admissions')
    .select('id, room_id')
    .eq('id', admissionId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!existing) return

  await supabase
    .from('admissions')
    .update({ status: 'DISCHARGED', discharged_at: new Date().toISOString() })
    .eq('id', admissionId)
    .eq('hospital_id', hospitalId)

  // Free the room
  if (existing.room_id) {
    await supabase
      .from('rooms')
      .update({ is_available: true })
      .eq('id', existing.room_id)
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'ADMISSION_DISCHARGED',
    description: `Patient discharged`,
    metadata: { admissionId },
  })

  revalidatePath('/hospital/admissions')
}
