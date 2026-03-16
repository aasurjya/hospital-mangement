import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NewRecordForm } from './new-record-form'

export const metadata = { title: 'New Medical Record' }

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const { profile } = await requireAuth()
  const { patientId } = await searchParams

  const supabase = await createSupabaseServerClient()
  const hospitalId = profile.hospital_id!

  const { data: preselectedPatient } = patientId
    ? await supabase.from('patients').select('id, full_name, mrn').eq('id', patientId).eq('hospital_id', hospitalId).single()
    : { data: null }

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6">
        <a href="/hospital/records" className="text-sm text-neutral-500 hover:text-neutral-700">← Records</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">New medical record</h1>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <NewRecordForm preselectedPatient={preselectedPatient ?? null} />
      </div>
    </div>
  )
}
