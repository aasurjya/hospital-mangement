import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NewAppointmentForm } from './new-appointment-form'

export const metadata = { title: 'Request Appointment' }

export default async function NewAppointmentPage() {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const [doctorsResult, departmentsResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, full_name')
      .eq('hospital_id', hospitalId)
      .eq('role', 'DOCTOR')
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('departments')
      .select('id, name')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <a href="/patient/appointments" className="text-sm text-neutral-500 hover:text-neutral-700">&larr; Appointments</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Request Appointment</h1>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <NewAppointmentForm
          doctors={doctorsResult.data ?? []}
          departments={departmentsResult.data ?? []}
        />
      </div>
    </div>
  )
}
