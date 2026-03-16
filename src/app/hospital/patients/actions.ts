'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { generateMrn } from '@/lib/patients/mrn'
import { z } from 'zod'
import type { PatientGender, BloodType } from '@/types/database'

const patientSchema = z.object({
  full_name: z.string().min(2).max(100),
  date_of_birth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as [PatientGender, ...PatientGender[]]).optional(),
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'] as [BloodType, ...BloodType[]]).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(300).optional(),
  emergency_contact_name: z.string().max(100).optional(),
  emergency_contact_phone: z.string().max(30).optional(),
  insurance_provider: z.string().max(100).optional(),
  insurance_number: z.string().max(100).optional(),
})

export type PatientState = { error?: string; fieldErrors?: Record<string, string[]> } | null

export async function createPatientAction(
  _prev: PatientState,
  formData: FormData
): Promise<PatientState> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id!

  const raw = Object.fromEntries(
    ['full_name', 'date_of_birth', 'gender', 'blood_type', 'phone', 'email',
     'address', 'emergency_contact_name', 'emergency_contact_phone', 'insurance_provider', 'insurance_number']
      .map((k) => [k, (formData.get(k) as string) || undefined])
  )

  const parsed = patientSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  // Retry MRN generation up to 3 times in case of collision
  let patient = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const mrn = generateMrn()
    const { data, error } = await supabase
      .from('patients')
      .insert({
        hospital_id: hospitalId,
        mrn,
        full_name: parsed.data.full_name,
        date_of_birth: parsed.data.date_of_birth ?? null,
        gender: parsed.data.gender ?? null,
        blood_type: parsed.data.blood_type ?? null,
        phone: parsed.data.phone ?? null,
        email: parsed.data.email || null,
        address: parsed.data.address ?? null,
        emergency_contact_name: parsed.data.emergency_contact_name ?? null,
        emergency_contact_phone: parsed.data.emergency_contact_phone ?? null,
        insurance_provider: parsed.data.insurance_provider ?? null,
        insurance_number: parsed.data.insurance_number ?? null,
        created_by: ctx.userId,
      })
      .select('id, mrn, full_name')
      .single()

    if (!error) { patient = data; break }
    if (error.code !== '23505') return { error: 'Failed to register patient. Please try again.' }
  }

  if (!patient) return { error: 'Failed to generate unique MRN. Please try again.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'PATIENT_CREATED',
    description: `Patient "${patient.full_name}" registered (${patient.mrn})`,
    metadata: { patientId: patient.id, mrn: patient.mrn },
  })

  revalidatePath('/hospital/patients')
  redirect(`/hospital/patients/${patient.id}`)
}
