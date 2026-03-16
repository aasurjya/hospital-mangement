'use server'

import { revalidatePath } from 'next/cache'
import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { updateProfileSchema } from '@/lib/patient/schemas'

export type ProfileActionState = { status: 'success' } | { status: 'error'; error: string; fieldErrors?: Record<string, string[]> } | null

export async function updatePatientProfileAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const parsed = updateProfileSchema.safeParse({
    phone: (formData.get('phone') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    emergency_contact_name: (formData.get('emergency_contact_name') as string) || undefined,
    emergency_contact_phone: (formData.get('emergency_contact_phone') as string) || undefined,
  })

  if (!parsed.success) {
    return { status: 'error', error: 'Please fix the fields below.', fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('patients')
    .update({
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      address: parsed.data.address ?? null,
      emergency_contact_name: parsed.data.emergency_contact_name ?? null,
      emergency_contact_phone: parsed.data.emergency_contact_phone ?? null,
    })
    .eq('id', ctx.patientId)
    .eq('hospital_id', hospitalId)

  if (error) return { status: 'error', error: 'Failed to update profile.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: ctx.patientId,
    eventType: 'PATIENT_PROFILE_UPDATED',
    description: 'Patient updated contact information',
    metadata: { patientId: ctx.patientId },
  })

  revalidatePath('/patient/profile')
  return { status: 'success' }
}
