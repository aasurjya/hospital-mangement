'use server'

import { requireHospitalAdmin } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { generateTempPassword } from '@/lib/hospitals/password'
import { STAFF_ROLES } from '@/lib/rbac/constants'
import { z } from 'zod'
import type { AppRole, EmploymentType } from '@/types/database'

const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONSULTANT']

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

const profileFieldsSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  // Professional
  specialty: z.string().max(200).optional(),
  qualifications: z.string().max(500).optional(),
  license_number: z.string().max(100).optional(),
  license_expiry: z.string().optional(),
  registration_number: z.string().max(100).optional(),
  years_of_experience: z.number().int().min(0).max(70).optional(),
  // Employment
  department_id: z.string().uuid().optional(),
  employment_type: z.enum(EMPLOYMENT_TYPES as [EmploymentType, ...EmploymentType[]]).optional(),
  hire_date: z.string().optional(),
  // Emergency contact
  emergency_contact_name: z.string().max(100).optional(),
  emergency_contact_phone: z.string().max(30).optional(),
})

const updateStaffSchema = profileFieldsSchema.extend({
  role: z.enum(STAFF_ROLES as [AppRole, ...AppRole[]]),
})

const PROFILE_SELECT = 'id, full_name, phone, is_active, role, address, specialty, qualifications, license_number, license_expiry, registration_number, years_of_experience, department_id, employment_type, hire_date, emergency_contact_name, emergency_contact_phone'

async function loadStaffGuard(staffId: string, hospitalId: string) {
  const supabase = createSupabaseServiceClient()
  const { data: staff } = await supabase
    .from('user_profiles')
    .select(PROFILE_SELECT)
    .eq('id', staffId)
    .eq('hospital_id', hospitalId)
    .neq('role', 'PLATFORM_ADMIN')
    .single()
  return { supabase, staff }
}

function extractProfileFields(formData: FormData) {
  const yearsRaw = formData.get('years_of_experience') as string
  return {
    full_name: formData.get('full_name'),
    phone: (formData.get('phone') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    specialty: (formData.get('specialty') as string) || undefined,
    qualifications: (formData.get('qualifications') as string) || undefined,
    license_number: (formData.get('license_number') as string) || undefined,
    license_expiry: (formData.get('license_expiry') as string) || undefined,
    registration_number: (formData.get('registration_number') as string) || undefined,
    years_of_experience: yearsRaw ? parseInt(yearsRaw, 10) : undefined,
    department_id: (formData.get('department_id') as string) || undefined,
    employment_type: (formData.get('employment_type') as string) || undefined,
    hire_date: (formData.get('hire_date') as string) || undefined,
    emergency_contact_name: (formData.get('emergency_contact_name') as string) || undefined,
    emergency_contact_phone: (formData.get('emergency_contact_phone') as string) || undefined,
  }
}

function buildUpdatePayload(data: z.infer<typeof profileFieldsSchema>) {
  return {
    full_name: data.full_name,
    phone: data.phone ?? null,
    address: data.address ?? null,
    specialty: data.specialty ?? null,
    qualifications: data.qualifications ?? null,
    license_number: data.license_number ?? null,
    license_expiry: data.license_expiry ?? null,
    registration_number: data.registration_number ?? null,
    years_of_experience: data.years_of_experience ?? null,
    department_id: data.department_id ?? null,
    employment_type: data.employment_type ?? null,
    hire_date: data.hire_date ?? null,
    emergency_contact_name: data.emergency_contact_name ?? null,
    emergency_contact_phone: data.emergency_contact_phone ?? null,
  }
}

export async function updateStaffAction(
  staffId: string,
  _prev: EditProfileState,
  formData: FormData
): Promise<EditProfileState> {
  const ctx = await requireHospitalAdmin()
  const hospitalId = ctx.profile.hospital_id!

  const { supabase, staff } = await loadStaffGuard(staffId, hospitalId)
  if (!staff) return { status: 'error', error: 'Staff member not found.' }

  const rawFields = extractProfileFields(formData)

  if (staff.role === 'HOSPITAL_ADMIN') {
    const parsed = profileFieldsSchema.safeParse(rawFields)
    if (!parsed.success) {
      return {
        status: 'error',
        error: 'Please fix the fields below.',
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }
    const { error } = await supabase
      .from('user_profiles')
      .update(buildUpdatePayload(parsed.data))
      .eq('id', staffId)
    if (error) return { status: 'error', error: 'Failed to update profile. Please try again.' }
    return { status: 'success' }
  }

  const parsed = updateStaffSchema.safeParse({
    ...rawFields,
    role: formData.get('role'),
  })
  if (!parsed.success) {
    return {
      status: 'error',
      error: 'Please fix the fields below.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ ...buildUpdatePayload(parsed.data), role: parsed.data.role })
    .eq('id', staffId)

  if (error) return { status: 'error', error: 'Failed to update profile. Please try again.' }

  if (parsed.data.role !== staff.role) {
    const { error: authError } = await supabase.auth.admin.updateUserById(staffId, {
      app_metadata: { role: parsed.data.role, hospital_id: hospitalId },
    })
    if (authError) {
      console.error('[staff] Failed to sync role in app_metadata:', authError.message)
    }

    await writeAuditLog({
      hospitalId,
      actorId: ctx.userId,
      actorRole: ctx.profile.role,
      subjectId: staffId,
      eventType: 'ROLE_CHANGED',
      description: `Role changed for "${parsed.data.full_name}": ${staff.role} → ${parsed.data.role}`,
      metadata: { staffId, oldRole: staff.role, newRole: parsed.data.role },
    })
  }

  return { status: 'success' }
}

export async function toggleStaffStatusAction(
  staffId: string,
  activate: boolean
): Promise<ToggleStatusState> {
  const ctx = await requireHospitalAdmin()
  const hospitalId = ctx.profile.hospital_id!

  if (staffId === ctx.userId) {
    return { status: 'error', error: 'You cannot deactivate your own account.' }
  }

  const { supabase, staff } = await loadStaffGuard(staffId, hospitalId)
  if (!staff) return { status: 'error', error: 'Staff member not found.' }

  const { error } = await supabase
    .from('user_profiles')
    .update({ is_active: activate })
    .eq('id', staffId)

  if (error) return { status: 'error', error: 'Failed to update status. Please try again.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: staffId,
    eventType: activate ? 'USER_REACTIVATED' : 'USER_DEACTIVATED',
    description: `Staff member "${staff.full_name}" ${activate ? 'reactivated' : 'deactivated'}`,
    metadata: { staffId, activate },
  })

  return { status: 'success', isActive: activate, name: staff.full_name }
}

export async function resetStaffPasswordAction(staffId: string): Promise<ResetPasswordState> {
  const ctx = await requireHospitalAdmin()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = createSupabaseServiceClient()

  const { data: staff } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .eq('id', staffId)
    .eq('hospital_id', hospitalId)
    .neq('role', 'PLATFORM_ADMIN')
    .single()

  if (!staff) return { status: 'error', error: 'Staff member not found.' }

  const { data: authUser, error: authFetchError } = await supabase.auth.admin.getUserById(staffId)
  if (authFetchError || !authUser.user.email) {
    return { status: 'error', error: 'Failed to retrieve staff account.' }
  }

  const tempPassword = generateTempPassword()
  const { error } = await supabase.auth.admin.updateUserById(staffId, { password: tempPassword })
  if (error) return { status: 'error', error: 'Failed to reset password. Please try again.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: staffId,
    eventType: 'PASSWORD_RESET',
    description: `Password reset for staff member "${staff.full_name}"`,
    metadata: { staffId },
  })

  return { status: 'success', tempPassword, email: authUser.user.email }
}
