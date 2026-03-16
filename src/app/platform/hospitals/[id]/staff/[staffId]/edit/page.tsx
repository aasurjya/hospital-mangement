import { notFound } from 'next/navigation'
import { requirePlatformAdmin } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { EditPlatformStaffForm } from './edit-platform-staff-form'
import type { AppRole, EmploymentType } from '@/types/database'

export const metadata = { title: 'Edit Staff Member | Platform Admin' }

export default async function EditPlatformStaffPage({
  params,
}: {
  params: Promise<{ id: string; staffId: string }>
}) {
  await requirePlatformAdmin()
  const { id: hospitalId, staffId } = await params

  const supabase = createSupabaseServiceClient()

  const [staffResult, departmentsResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, full_name, phone, is_active, role, address, specialty, qualifications, license_number, license_expiry, registration_number, years_of_experience, department_id, employment_type, hire_date, emergency_contact_name, emergency_contact_phone, created_at')
      .eq('id', staffId)
      .eq('hospital_id', hospitalId)
      .neq('role', 'PLATFORM_ADMIN')
      .single(),
    supabase
      .from('departments')
      .select('id, name')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('name'),
  ])

  const staff = staffResult.data
  if (!staff) notFound()

  const { data: authUser } = await supabase.auth.admin.getUserById(staffId)
  const email = authUser?.user?.email ?? ''

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-2">
      {/* Breadcrumb */}
      <nav className="text-sm text-neutral-500 space-x-1">
        <a href="/platform/hospitals" className="hover:text-neutral-700">Hospitals</a>
        <span>/</span>
        <a href={`/platform/hospitals/${hospitalId}`} className="hover:text-neutral-700">Hospital</a>
        <span>/</span>
        <a href={`/platform/hospitals/${hospitalId}`} className="hover:text-neutral-700">Staff</a>
        <span>/</span>
        <span className="text-neutral-900">Edit</span>
      </nav>

      <h1 className="text-2xl font-semibold text-neutral-900 pt-2">Edit staff member</h1>
      <p className="text-sm text-neutral-500">{email}</p>

      <div className="pt-4">
        <EditPlatformStaffForm
          hospitalId={hospitalId}
          staffId={staffId}
          departments={departmentsResult.data ?? []}
          initialData={{
            full_name: staff.full_name ?? '',
            phone: staff.phone ?? '',
            role: staff.role as AppRole,
            is_active: staff.is_active,
            address: staff.address ?? '',
            specialty: staff.specialty ?? '',
            qualifications: staff.qualifications ?? '',
            license_number: staff.license_number ?? '',
            license_expiry: staff.license_expiry ?? '',
            registration_number: staff.registration_number ?? '',
            years_of_experience: staff.years_of_experience,
            department_id: staff.department_id ?? '',
            employment_type: staff.employment_type as EmploymentType | null,
            hire_date: staff.hire_date ?? '',
            emergency_contact_name: staff.emergency_contact_name ?? '',
            emergency_contact_phone: staff.emergency_contact_phone ?? '',
          }}
        />
      </div>
    </div>
  )
}
