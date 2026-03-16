import { requireHospitalAdmin } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { DepartmentList } from './department-list'

export const metadata = { title: 'Departments' }

export default async function DepartmentsPage() {
  const { profile } = await requireHospitalAdmin()

  const supabase = await createSupabaseServerClient()
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .eq('hospital_id', profile.hospital_id!)
    .order('name')

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Departments</h1>
        <a
          href="/hospital/departments/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-600 px-5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          Add department
        </a>
      </div>
      <DepartmentList departments={departments ?? []} />
    </div>
  )
}
