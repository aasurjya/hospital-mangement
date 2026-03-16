'use server'

import { revalidatePath } from 'next/cache'
import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { VITALS_MANAGEMENT_ROLES } from '@/lib/clinical/permissions'
import { vitalSignsSchema } from '@/lib/clinical/schemas'

export type VitalsActionState = { error?: string; fieldErrors?: Record<string, string[]>; success?: boolean } | null

function toNumberOrNull(val: unknown): number | null {
  if (val === '' || val === undefined || val === null) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function computeBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm || heightCm === 0) return null
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export async function recordVitalsAction(
  _prev: VitalsActionState,
  formData: FormData
): Promise<VitalsActionState> {
  const ctx = await requireRoles(VITALS_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = vitalSignsSchema.safeParse({
    patient_id: formData.get('patient_id'),
    admission_id: (formData.get('admission_id') as string) || undefined,
    systolic_bp: (formData.get('systolic_bp') as string) || '',
    diastolic_bp: (formData.get('diastolic_bp') as string) || '',
    heart_rate: (formData.get('heart_rate') as string) || '',
    temperature: (formData.get('temperature') as string) || '',
    respiratory_rate: (formData.get('respiratory_rate') as string) || '',
    o2_saturation: (formData.get('o2_saturation') as string) || '',
    weight_kg: (formData.get('weight_kg') as string) || '',
    height_cm: (formData.get('height_cm') as string) || '',
    pain_scale: (formData.get('pain_scale') as string) || '',
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const d = parsed.data
  const weightKg = toNumberOrNull(d.weight_kg)
  const heightCm = toNumberOrNull(d.height_cm)
  const bmi = computeBmi(weightKg, heightCm)

  const supabase = createSupabaseServiceClient()

  const { data: vitals, error } = await supabase
    .from('vital_signs')
    .insert({
      hospital_id: hospitalId,
      patient_id: d.patient_id,
      admission_id: d.admission_id || null,
      systolic_bp: toNumberOrNull(d.systolic_bp),
      diastolic_bp: toNumberOrNull(d.diastolic_bp),
      heart_rate: toNumberOrNull(d.heart_rate),
      temperature: toNumberOrNull(d.temperature),
      respiratory_rate: toNumberOrNull(d.respiratory_rate),
      o2_saturation: toNumberOrNull(d.o2_saturation),
      weight_kg: weightKg,
      height_cm: heightCm,
      bmi,
      pain_scale: toNumberOrNull(d.pain_scale),
      notes: d.notes ?? null,
      recorded_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Failed to record vital signs. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'VITAL_SIGNS_RECORDED',
    subjectId: d.patient_id,
    description: 'Vital signs recorded',
    metadata: { vitalSignsId: vitals.id },
  })

  revalidatePath(`/hospital/patients/${d.patient_id}/vitals`)
  return { success: true }
}
