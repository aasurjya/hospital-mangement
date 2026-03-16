'use server'

import { requirePlatformAdmin } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { generateTempPassword } from '@/lib/hospitals/password'
import { z } from 'zod'

export type EditProfileState =
  | null
  | { status: 'success' }
  | { status: 'error'; error: string; fieldErrors?: Record<string, string[]> }

export type ToggleStatusState =
  | null
  | { status: 'success'; isActive: boolean; name: string }
  | { status: 'error'; error: string }

export type ResetPasswordState =
  | null
  | { status: 'success'; tempPassword: string; email: string }
  | { status: 'error'; error: string }

const updateAdminSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().max(30).optional(),
})

async function loadAdminGuard(hospitalId: string, adminId: string) {
  const supabase = createSupabaseServiceClient()
  const { data: admin } = await supabase
    .from('user_profiles')
    .select('id, full_name, phone, is_active')
    .eq('id', adminId)
    .eq('hospital_id', hospitalId)
    .eq('role', 'HOSPITAL_ADMIN')
    .single()
  return { supabase, admin }
}

export async function updateHospitalAdminAction(
  hospitalId: string,
  adminId: string,
  _prev: EditProfileState,
  formData: FormData
): Promise<EditProfileState> {
  await requirePlatformAdmin()

  const parsed = updateAdminSchema.safeParse({
    full_name: formData.get('full_name'),
    phone: (formData.get('phone') as string) || undefined,
  })
  if (!parsed.success) {
    return {
      status: 'error',
      error: 'Please fix the fields below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { supabase, admin } = await loadAdminGuard(hospitalId, adminId)
  if (!admin) return { status: 'error', error: 'Admin not found.' }

  const { error } = await supabase
    .from('user_profiles')
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone ?? null })
    .eq('id', adminId)

  if (error) return { status: 'error', error: 'Failed to update profile. Please try again.' }

  return { status: 'success' }
}

export async function toggleHospitalAdminStatusAction(
  hospitalId: string,
  adminId: string,
  activate: boolean
): Promise<ToggleStatusState> {
  const ctx = await requirePlatformAdmin()

  const { supabase, admin } = await loadAdminGuard(hospitalId, adminId)
  if (!admin) return { status: 'error', error: 'Admin not found.' }

  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: activate })
    .eq('id', adminId)

  if (error) return { status: 'error', error: 'Failed to update status. Please try again.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: adminId,
    eventType: activate ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
    description: `Hospital admin "${admin.full_name}" ${activate ? 'reactivated' : 'deactivated'}`,
    metadata: { adminId, activate },
  })

  return { status: 'success', isActive: activate, name: admin.full_name }
}

export async function resetHospitalAdminPasswordAction(
  hospitalId: string,
  adminId: string
): Promise<ResetPasswordState> {
  const ctx = await requirePlatformAdmin()

  const supabase = createSupabaseServiceClient()

  // Verify admin belongs to this hospital and has the correct role
  const { data: admin } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .eq('id', adminId)
    .eq('hospital_id', hospitalId)
    .eq('role', 'HOSPITAL_ADMIN')
    .single()

  if (!admin) return { status: 'error', error: 'Admin not found.' }

  // Get email from auth
  const { data: authUser, error: authFetchError } = await supabase.auth.admin.getUserById(adminId)
  if (authFetchError || !authUser.user.email) {
    return { status: 'error', error: 'Failed to retrieve admin account.' }
  }

  const tempPassword = generateTempPassword()
  const { error } = await supabase.auth.admin.updateUserById(adminId, { password: tempPassword })
  if (error) return { status: 'error', error: 'Failed to reset password. Please try again.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: adminId,
    eventType: 'PASSWORD_RESET',
    description: `Password reset for hospital admin "${admin.full_name}"`,
    metadata: { adminId },
  })

  return { status: 'success', tempPassword, email: authUser.user.email }
}
