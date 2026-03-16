'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRoles } from '@/lib/rbac/guards'
import { CLINICAL_ROLES } from '@/lib/rbac/roles'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { z } from 'zod'

const recordSchema = z.object({
  patient_id: z.string().uuid(),
  admission_id: z.string().uuid().optional().or(z.literal('')),
  appointment_id: z.string().uuid().optional().or(z.literal('')),
  chief_complaint: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
})

export type RecordState = { error?: string; fieldErrors?: Record<string, string[]> } | null

export async function createMedicalRecordAction(
  _prev: RecordState,
  formData: FormData
): Promise<RecordState> {
  const ctx = await requireRoles([...CLINICAL_ROLES, 'HOSPITAL_ADMIN'])
  const hospitalId = ctx.profile.hospital_id!

  const parsed = recordSchema.safeParse({
    patient_id: formData.get('patient_id'),
    admission_id: (formData.get('admission_id') as string) || undefined,
    appointment_id: (formData.get('appointment_id') as string) || undefined,
    chief_complaint: (formData.get('chief_complaint') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()
  const { data: record, error } = await supabase
    .from('medical_records')
    .insert({
      hospital_id: hospitalId,
      patient_id: parsed.data.patient_id,
      author_id: ctx.userId,
      admission_id: parsed.data.admission_id || null,
      appointment_id: parsed.data.appointment_id || null,
      chief_complaint: parsed.data.chief_complaint ?? null,
      notes: parsed.data.notes ?? null,
      status: 'DRAFT',
    })
    .select('id')
    .single()

  if (error) return { error: 'Failed to create medical record.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'RECORD_CREATED',
    description: `Medical record created for patient ${parsed.data.patient_id}`,
    metadata: { recordId: record.id },
  })

  revalidatePath('/hospital/records')
  redirect(`/hospital/records/${record.id}`)
}

export async function finalizeRecordAction(recordId: string): Promise<{ error?: string }> {
  const ctx = await requireRoles(['DOCTOR'])
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('medical_records')
    .update({ status: 'FINALIZED', finalized_at: new Date().toISOString(), finalized_by: ctx.userId })
    .eq('id', recordId)
    .eq('hospital_id', ctx.profile.hospital_id!)

  if (error) return { error: 'Failed to finalize record.' }

  await writeAuditLog({
    hospitalId: ctx.profile.hospital_id!,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'RECORD_FINALIZED',
    description: `Medical record finalized`,
    metadata: { recordId },
  })

  revalidatePath('/hospital/records')
  revalidatePath(`/hospital/records/${recordId}`)
  return {}
}
