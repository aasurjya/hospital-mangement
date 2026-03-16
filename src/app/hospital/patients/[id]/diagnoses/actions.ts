'use server'

import { revalidatePath } from 'next/cache'
import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { DIAGNOSIS_MANAGEMENT_ROLES } from '@/lib/clinical/permissions'
import { diagnosisSchema, updateDiagnosisSchema } from '@/lib/clinical/schemas'
import type { DiagnosisStatus } from '@/types/database'

export type DiagnosisActionState = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean } | null

export async function createDiagnosisAction(
  _prev: DiagnosisActionState,
  formData: FormData
): Promise<DiagnosisActionState> {
  const ctx = await requireRoles(DIAGNOSIS_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = diagnosisSchema.safeParse({
    patient_id: formData.get('patient_id'),
    icd10_code: (formData.get('icd10_code') as string) || undefined,
    description: formData.get('description'),
    status: (formData.get('status') as string) || undefined,
    diagnosed_date: formData.get('diagnosed_date'),
    medical_record_id: (formData.get('medical_record_id') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  const { data: diagnosis, error } = await supabase
    .from('patient_diagnoses')
    .insert({
      hospital_id: hospitalId,
      patient_id: parsed.data.patient_id,
      icd10_code: parsed.data.icd10_code ?? null,
      description: parsed.data.description,
      status: (parsed.data.status as DiagnosisStatus) ?? 'ACTIVE',
      diagnosed_date: parsed.data.diagnosed_date,
      medical_record_id: parsed.data.medical_record_id || null,
      notes: parsed.data.notes ?? null,
      diagnosed_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Failed to record diagnosis. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'DIAGNOSIS_CREATED',
    subjectId: parsed.data.patient_id,
    description: `Diagnosis "${parsed.data.description}" recorded`,
    metadata: { diagnosisId: diagnosis.id, icd10_code: parsed.data.icd10_code ?? null },
  })

  revalidatePath(`/hospital/patients/${parsed.data.patient_id}/diagnoses`)
  return { success: true }
}

export async function updateDiagnosisAction(
  diagnosisId: string,
  patientId: string,
  _prev: DiagnosisActionState,
  formData: FormData
): Promise<DiagnosisActionState> {
  const ctx = await requireRoles(DIAGNOSIS_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = updateDiagnosisSchema.safeParse({
    icd10_code: (formData.get('icd10_code') as string) || undefined,
    description: formData.get('description'),
    status: formData.get('status'),
    diagnosed_date: formData.get('diagnosed_date'),
    resolved_date: (formData.get('resolved_date') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('patient_diagnoses')
    .update({
      icd10_code: parsed.data.icd10_code ?? null,
      description: parsed.data.description,
      status: parsed.data.status as DiagnosisStatus,
      diagnosed_date: parsed.data.diagnosed_date,
      resolved_date: parsed.data.resolved_date ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq('id', diagnosisId)
    .eq('hospital_id', hospitalId)

  if (error) {
    return { error: 'Failed to update diagnosis. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'DIAGNOSIS_UPDATED',
    subjectId: patientId,
    description: `Diagnosis updated to ${parsed.data.status}`,
    metadata: { diagnosisId, status: parsed.data.status },
  })

  revalidatePath(`/hospital/patients/${patientId}/diagnoses`)
  return { success: true }
}
