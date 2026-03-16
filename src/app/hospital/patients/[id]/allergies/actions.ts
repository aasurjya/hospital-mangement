'use server'

import { revalidatePath } from 'next/cache'
import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { ALLERGY_MANAGEMENT_ROLES } from '@/lib/clinical/permissions'
import { allergySchema, updateAllergySchema } from '@/lib/clinical/schemas'
import type { AllergenType, AllergySeverity, AllergyStatus } from '@/types/database'

export type AllergyActionState = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean } | null

export async function createAllergyAction(
  _prev: AllergyActionState,
  formData: FormData
): Promise<AllergyActionState> {
  const ctx = await requireRoles(ALLERGY_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = allergySchema.safeParse({
    patient_id: formData.get('patient_id'),
    allergen_name: formData.get('allergen_name'),
    allergen_type: formData.get('allergen_type'),
    severity: formData.get('severity'),
    reaction: (formData.get('reaction') as string) || undefined,
    status: (formData.get('status') as string) || undefined,
    onset_date: (formData.get('onset_date') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  const { data: allergy, error } = await supabase
    .from('patient_allergies')
    .insert({
      hospital_id: hospitalId,
      patient_id: parsed.data.patient_id,
      allergen_name: parsed.data.allergen_name,
      allergen_type: parsed.data.allergen_type as AllergenType,
      severity: parsed.data.severity as AllergySeverity,
      reaction: parsed.data.reaction ?? null,
      status: (parsed.data.status as AllergyStatus) ?? 'ACTIVE',
      onset_date: parsed.data.onset_date ?? null,
      notes: parsed.data.notes ?? null,
      recorded_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Failed to record allergy. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'ALLERGY_CREATED',
    subjectId: parsed.data.patient_id,
    description: `Allergy "${parsed.data.allergen_name}" recorded for patient`,
    metadata: { allergyId: allergy.id, allergen_type: parsed.data.allergen_type, severity: parsed.data.severity },
  })

  revalidatePath(`/hospital/patients/${parsed.data.patient_id}/allergies`)
  return { success: true }
}

export async function updateAllergyAction(
  allergyId: string,
  patientId: string,
  _prev: AllergyActionState,
  formData: FormData
): Promise<AllergyActionState> {
  const ctx = await requireRoles(ALLERGY_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = updateAllergySchema.safeParse({
    allergen_name: formData.get('allergen_name'),
    allergen_type: formData.get('allergen_type'),
    severity: formData.get('severity'),
    reaction: (formData.get('reaction') as string) || undefined,
    status: formData.get('status'),
    onset_date: (formData.get('onset_date') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('patient_allergies')
    .update({
      allergen_name: parsed.data.allergen_name,
      allergen_type: parsed.data.allergen_type as AllergenType,
      severity: parsed.data.severity as AllergySeverity,
      reaction: parsed.data.reaction ?? null,
      status: parsed.data.status as AllergyStatus,
      onset_date: parsed.data.onset_date ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq('id', allergyId)
    .eq('hospital_id', hospitalId)

  if (error) {
    return { error: 'Failed to update allergy. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'ALLERGY_UPDATED',
    subjectId: patientId,
    description: `Allergy "${parsed.data.allergen_name}" updated`,
    metadata: { allergyId, status: parsed.data.status },
  })

  revalidatePath(`/hospital/patients/${patientId}/allergies`)
  return { success: true }
}

export async function deleteAllergyAction(
  allergyId: string,
  patientId: string
): Promise<AllergyActionState> {
  const ctx = await requireRoles(ALLERGY_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('patient_allergies')
    .delete()
    .eq('id', allergyId)
    .eq('hospital_id', hospitalId)

  if (error) {
    return { error: 'Failed to delete allergy.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'ALLERGY_DELETED',
    subjectId: patientId,
    description: `Allergy record deleted`,
    metadata: { allergyId },
  })

  revalidatePath(`/hospital/patients/${patientId}/allergies`)
  return { success: true }
}
