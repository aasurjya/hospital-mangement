'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import {
  PRESCRIBE_MANAGEMENT_ROLES,
  DISPENSE_MANAGEMENT_ROLES,
  ADMINISTER_MANAGEMENT_ROLES,
  FORMULARY_MANAGEMENT_ROLES,
} from '@/lib/prescriptions/permissions'
import { prescriptionSchema, formularySchema } from '@/lib/prescriptions/schemas'
import type { MedicationRoute, PrescriptionStatus } from '@/types/database'

export type PrescriptionActionState = { error?: string; fieldErrors?: Record<string, string[]>; allergyWarning?: string } | null

export async function createPrescriptionAction(
  _prev: PrescriptionActionState,
  formData: FormData
): Promise<PrescriptionActionState> {
  const ctx = await requireRoles(PRESCRIBE_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = prescriptionSchema.safeParse({
    patient_id: formData.get('patient_id'),
    drug_id: (formData.get('drug_id') as string) || undefined,
    drug_name: formData.get('drug_name'),
    dosage: formData.get('dosage'),
    route: formData.get('route'),
    frequency: formData.get('frequency'),
    duration: (formData.get('duration') as string) || undefined,
    quantity: (formData.get('quantity') as string) || '',
    refills: (formData.get('refills') as string) || '',
    allergy_override: (formData.get('allergy_override') as string) || undefined,
    allergy_override_reason: (formData.get('allergy_override_reason') as string) || undefined,
    admission_id: (formData.get('admission_id') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()
  const d = parsed.data

  // Drug-allergy check
  const { data: allergies } = await supabase
    .from('patient_allergies')
    .select('allergen_name, severity')
    .eq('patient_id', d.patient_id)
    .eq('allergen_type', 'DRUG')
    .eq('status', 'ACTIVE')

  const matchedAllergy = allergies?.find((a) =>
    d.drug_name.toLowerCase().includes(a.allergen_name.toLowerCase()) ||
    a.allergen_name.toLowerCase().includes(d.drug_name.toLowerCase())
  )

  if (matchedAllergy && d.allergy_override !== 'on') {
    return {
      allergyWarning: `Patient has a known ${matchedAllergy.severity} allergy to "${matchedAllergy.allergen_name}". Override required to proceed.`,
    }
  }

  const isOverride = d.allergy_override === 'on' && !!matchedAllergy

  const { data: prescription, error } = await supabase
    .from('prescriptions')
    .insert({
      hospital_id: hospitalId,
      patient_id: d.patient_id,
      drug_id: d.drug_id || null,
      drug_name: d.drug_name,
      dosage: d.dosage,
      route: d.route as MedicationRoute,
      frequency: d.frequency,
      duration: d.duration ?? null,
      quantity: typeof d.quantity === 'number' ? d.quantity : null,
      refills: typeof d.refills === 'number' ? d.refills : 0,
      allergy_override: isOverride,
      allergy_override_reason: isOverride ? (d.allergy_override_reason ?? null) : null,
      admission_id: d.admission_id || null,
      notes: d.notes ?? null,
      prescribed_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Failed to create prescription. Please try again.' }
  }

  // Create initial medication order
  await supabase.from('medication_orders').insert({
    hospital_id: hospitalId,
    prescription_id: prescription.id,
    patient_id: d.patient_id,
    status: 'ORDERED',
    ordered_by: ctx.userId,
  })

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'PRESCRIPTION_CREATED',
    subjectId: d.patient_id,
    description: `Prescription for "${d.drug_name}" created${isOverride ? ' (allergy override)' : ''}`,
    metadata: { prescriptionId: prescription.id, drug_name: d.drug_name, allergy_override: isOverride },
  })

  revalidatePath('/hospital/prescriptions')
  redirect('/hospital/prescriptions')
}

export async function updatePrescriptionStatusAction(
  prescriptionId: string,
  status: PrescriptionStatus
): Promise<{ error?: string }> {
  const ctx = await requireRoles(PRESCRIBE_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('prescriptions')
    .update({ status })
    .eq('id', prescriptionId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to update prescription.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'PRESCRIPTION_UPDATED',
    description: `Prescription ${prescriptionId} updated to ${status}`,
    metadata: { prescriptionId, status },
  })

  revalidatePath('/hospital/prescriptions')
  return {}
}

export async function dispenseMedicationAction(orderId: string): Promise<{ error?: string }> {
  const ctx = await requireRoles(DISPENSE_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('medication_orders')
    .update({
      status: 'DISPENSED',
      dispensed_by: ctx.userId,
      dispensed_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to dispense medication.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'MEDICATION_DISPENSED',
    description: `Medication order ${orderId} dispensed`,
    metadata: { orderId },
  })

  revalidatePath('/hospital/prescriptions')
  return {}
}

export async function administerMedicationAction(orderId: string): Promise<{ error?: string }> {
  const ctx = await requireRoles(ADMINISTER_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('medication_orders')
    .update({
      status: 'ADMINISTERED',
      administered_by: ctx.userId,
      administered_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to mark as administered.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'MEDICATION_ADMINISTERED',
    description: `Medication order ${orderId} administered`,
    metadata: { orderId },
  })

  revalidatePath('/hospital/prescriptions')
  return {}
}

export type FormularyActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null

export async function createFormularyItemAction(
  _prev: FormularyActionState,
  formData: FormData
): Promise<FormularyActionState> {
  const ctx = await requireRoles(FORMULARY_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = formularySchema.safeParse({
    generic_name: formData.get('generic_name'),
    brand_name: (formData.get('brand_name') as string) || undefined,
    form: formData.get('form'),
    strength: (formData.get('strength') as string) || undefined,
    category: formData.get('category'),
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  const { error } = await supabase.from('drug_formulary').insert({
    hospital_id: hospitalId,
    generic_name: parsed.data.generic_name,
    brand_name: parsed.data.brand_name ?? null,
    form: parsed.data.form,
    strength: parsed.data.strength ?? null,
    category: parsed.data.category,
    notes: parsed.data.notes ?? null,
    created_by: ctx.userId,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This drug already exists in the formulary.' }
    }
    return { error: 'Failed to add drug. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'FORMULARY_CREATED',
    description: `Drug "${parsed.data.generic_name}" added to formulary`,
    metadata: { generic_name: parsed.data.generic_name, form: parsed.data.form },
  })

  revalidatePath('/hospital/formulary')
  redirect('/hospital/formulary')
}
