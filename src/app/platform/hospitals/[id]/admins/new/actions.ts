'use server'

import { requirePlatformAdmin } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { createHospitalAdminSchema } from '@/lib/hospitals/schemas'
import { generateTempPassword } from '@/lib/hospitals/password'

export type CreateAdminState =
  | { status: 'idle' }
  | { status: 'error'; error: string; fieldErrors?: Record<string, string[]> }
  | { status: 'success'; tempPassword: string; email: string; fullName: string }

export async function createHospitalAdminAction(
  hospitalId: string,
  _prev: CreateAdminState,
  formData: FormData
): Promise<CreateAdminState> {
  const ctx = await requirePlatformAdmin()

  const raw = {
    email: formData.get('email') as string,
    full_name: formData.get('full_name') as string,
  }

  const parsed = createHospitalAdminSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      status: 'error',
      error: 'Please fix the fields below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // Verify the hospital exists and belongs to platform admin scope
  const supabase = createSupabaseServiceClient()
  const { data: hospital } = await supabase
    .from('hospitals')
    .select('id, name')
    .eq('id', hospitalId)
    .single()

  if (!hospital) {
    return { status: 'error', error: 'Hospital not found.' }
  }

  // Generate a cryptographically secure temp password
  const tempPassword = generateTempPassword()

  // Create the Supabase Auth user (service role bypasses signup restrictions)
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { role: 'HOSPITAL_ADMIN', hospital_id: hospitalId },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { status: 'error', error: 'This email address is already registered.' }
    }
    return { status: 'error', error: 'Failed to create user account. Please try again.' }
  }

  const userId = authUser.user.id

  // Create the user profile
  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: userId,
    hospital_id: hospitalId,
    role: 'HOSPITAL_ADMIN',
    full_name: parsed.data.full_name,
    is_active: true,
  })

  if (profileError) {
    // Roll back the auth user to avoid orphaned accounts
    await supabase.auth.admin.deleteUser(userId)
    return { status: 'error', error: 'Failed to create user profile. Please try again.' }
  }

  // Audit log — password is NEVER logged, only the event
  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: userId,
    eventType: 'USER_CREATED',
    description: `Hospital admin "${parsed.data.full_name}" (${parsed.data.email}) created for ${hospital.name}`,
    metadata: {
      hospitalId,
      hospitalName: hospital.name,
      newUserEmail: parsed.data.email,
      newUserRole: 'HOSPITAL_ADMIN',
    },
  })

  // Return temp password in state — shown once in UI, never stored
  return {
    status: 'success',
    tempPassword,
    email: parsed.data.email,
    fullName: parsed.data.full_name,
  }
}
