import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PRESCRIBE_MANAGEMENT_ROLES } from '@/lib/prescriptions/permissions'
import { PrescriptionForm } from './prescription-form'

export const metadata = { title: 'New Prescription' }

export default async function NewPrescriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const ctx = await requireRoles(PRESCRIBE_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!
  const { patientId } = await searchParams
  const supabase = await createSupabaseServerClient()

  const [{ data: patients }, { data: formulary }] = await Promise.all([
    supabase.from('patients').select('id, full_name, mrn').eq('hospital_id', hospitalId).eq('is_active', true).order('full_name').limit(200),
    supabase.from('drug_formulary').select('id, generic_name, brand_name, form, strength').eq('hospital_id', hospitalId).eq('is_active', true).order('generic_name').limit(500),
  ])

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <a href="/hospital/prescriptions" className="text-sm text-neutral-500 hover:text-neutral-700">← Prescriptions</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">New Prescription</h1>
      </div>

      <PrescriptionForm
        patients={patients ?? []}
        formulary={formulary ?? []}
        defaultPatientId={patientId}
      />
    </div>
  )
}
