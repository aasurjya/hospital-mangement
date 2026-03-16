import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NewAdmissionForm } from './new-admission-form'

export const metadata = { title: 'Admit Patient' }

export default async function NewAdmissionPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const { profile } = await requireAuth()
  const { patientId } = await searchParams

  const supabase = await createSupabaseServerClient()
  const hospitalId = profile.hospital_id!

  const [
    { data: doctors },
    { data: departments },
    { data: rooms },
    { data: patients },
    { data: preselectedPatient },
  ] = await Promise.all([
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
    supabase
      .from('rooms')
      .select('id, room_number, room_type, floor')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .eq('is_available', true)
      .order('room_number'),
    supabase
      .from('patients')
      .select('id, full_name, mrn')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('full_name')
      .limit(200),
    patientId
      ? supabase
          .from('patients')
          .select('id, full_name, mrn')
          .eq('id', patientId)
          .eq('hospital_id', hospitalId)
          .single()
      : Promise.resolve({ data: null }),
  ])

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6">
        <a href="/hospital/admissions" className="text-sm text-neutral-500 hover:text-neutral-700">← Admissions</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Admit patient</h1>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <NewAdmissionForm
          doctors={doctors ?? []}
          departments={departments ?? []}
          rooms={rooms ?? []}
          patients={patients ?? []}
          preselectedPatient={preselectedPatient ?? null}
        />
      </div>
    </div>
  )
}
