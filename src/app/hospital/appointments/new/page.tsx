import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NewAppointmentForm } from './new-appointment-form'

export const metadata = { title: 'Book Appointment' }

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const { profile } = await requireAuth()
  const { patientId } = await searchParams

  const supabase = await createSupabaseServerClient()
  const hospitalId = profile.hospital_id!

  const [{ data: doctors }, { data: departments }, { data: preselectedPatient }] =
    await Promise.all([
      supabase.from('user_profiles').select('id, full_name').eq('hospital_id', hospitalId).eq('role', 'DOCTOR').eq('is_active', true).order('full_name'),
      supabase.from('departments').select('id, name').eq('hospital_id', hospitalId).eq('is_active', true).order('name'),
      patientId
        ? supabase.from('patients').select('id, full_name, mrn').eq('id', patientId).eq('hospital_id', hospitalId).single()
        : Promise.resolve({ data: null }),
    ])

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6">
        <a href="/hospital/appointments" className="text-sm text-neutral-500 hover:text-neutral-700">← Appointments</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Book appointment</h1>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <NewAppointmentForm
          hospitalId={hospitalId}
          doctors={doctors ?? []}
          departments={departments ?? []}
          preselectedPatient={preselectedPatient ?? null}
        />
      </div>
    </div>
  )
}
