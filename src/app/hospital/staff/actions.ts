'use server'

import { requireHospitalAdmin } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { generateTempPassword } from '@/lib/hospitals/password'
import { z } from 'zod'
import type { AppRole, EmploymentType } from '@/types/database'

const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONSULTANT']

const createStaffSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  full_name: z.string().min(2).max(100),
  role: z.enum([
    'DOCTOR', 'NURSE', 'RECEPTIONIST', 'LAB_TECHNICIAN',
    'PHARMACIST', 'BILLING_STAFF', 'ACCOUNTANT', 'HR_MANAGER', 'OPERATIONS_MANAGER',
  ] as [AppRole, ...AppRole[]]),
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
  employment_type: z.enum(EMPLOYMENT_TYPES as [EmploymentType, ...EmploymentType[]]).optional(),
  hire_date: z.string().optional(),
  // Emergency contact
  emergency_contact_name: z.string().max(100).optional(),
  emergency_contact_phone: z.string().max(30).optional(),
})

export type CreateStaffState =
  | { status: 'idle' }
  | { status: 'error'; error: string; fieldErrors?: Record<string, string[]> }
  | { status: 'success'; tempPassword: string; email: string; fullName: string; role: string }

export async function createStaffAction(
  _prev: CreateStaffState,
  formData: FormData
): Promise<CreateStaffState> {
  const ctx = await requireHospitalAdmin()
  const hospitalId = ctx.profile.hospital_id!

  const yearsRaw = formData.get('years_of_experience') as string
  const parsed = createStaffSchema.safeParse({
    email: formData.get('email'),
    full_name: formData.get('full_name'),
    role: formData.get('role'),
    phone: (formData.get('phone') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    specialty: (formData.get('specialty') as string) || undefined,
    qualifications: (formData.get('qualifications') as string) || undefined,
    license_number: (formData.get('license_number') as string) || undefined,
    license_expiry: (formData.get('license_expiry') as string) || undefined,
    registration_number: (formData.get('registration_number') as string) || undefined,
    years_of_experience: yearsRaw ? parseInt(yearsRaw, 10) : undefined,
    employment_type: (formData.get('employment_type') as string) || undefined,
    hire_date: (formData.get('hire_date') as string) || undefined,
    emergency_contact_name: (formData.get('emergency_contact_name') as string) || undefined,
    emergency_contact_phone: (formData.get('emergency_contact_phone') as string) || undefined,
  })
  if (!parsed.success) {
    return { status: 'error', error: 'Fix the fields below.', fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const tempPassword = generateTempPassword()
  const supabase = createSupabaseServiceClient()

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: parsed.data.email,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { role: parsed.data.role, hospital_id: hospitalId },
  })
  if (authError) {
    if (authError.message.includes('already registered')) return { status: 'error', error: 'This email is already registered.' }
    return { status: 'error', error: 'Failed to create account. Please try again.' }
  }

  const userId = authUser.user.id
  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: userId,
    hospital_id: hospitalId,
    role: parsed.data.role,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone ?? null,
    address: parsed.data.address ?? null,
    specialty: parsed.data.specialty ?? null,
    qualifications: parsed.data.qualifications ?? null,
    license_number: parsed.data.license_number ?? null,
    license_expiry: parsed.data.license_expiry ?? null,
    registration_number: parsed.data.registration_number ?? null,
    years_of_experience: parsed.data.years_of_experience ?? null,
    department_id: null,
    employment_type: parsed.data.employment_type ?? null,
    hire_date: parsed.data.hire_date ?? null,
    emergency_contact_name: parsed.data.emergency_contact_name ?? null,
    emergency_contact_phone: parsed.data.emergency_contact_phone ?? null,
    is_active: true,
  })

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId)
    return { status: 'error', error: 'Failed to create user profile.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: userId,
    eventType: 'USER_CREATED',
    description: `${parsed.data.role} "${parsed.data.full_name}" (${parsed.data.email}) created`,
    metadata: { newUserEmail: parsed.data.email, newUserRole: parsed.data.role },
  })

  return { status: 'success', tempPassword, email: parsed.data.email, fullName: parsed.data.full_name, role: parsed.data.role }
}
