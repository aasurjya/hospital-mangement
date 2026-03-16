import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { LAB_ORDER_ROLES } from '@/lib/labs/permissions'
import { LabOrderForm } from './lab-order-form'

export const metadata = { title: 'New Lab Order' }

export default async function NewLabOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const ctx = await requireRoles(LAB_ORDER_ROLES)
  const hospitalId = ctx.profile.hospital_id!
  const { patientId } = await searchParams
  const supabase = await createSupabaseServerClient()

  const [{ data: patients }, { data: catalogue }] = await Promise.all([
    supabase.from('patients').select('id, full_name, mrn').eq('hospital_id', hospitalId).eq('is_active', true).order('full_name').limit(200),
    supabase.from('lab_test_catalogue').select('id, test_name, test_code, sample_type').eq('hospital_id', hospitalId).eq('is_active', true).order('test_name').limit(200),
  ])

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <a href="/hospital/labs" className="text-sm text-neutral-500 hover:text-neutral-700">← Lab Orders</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">New Lab Order</h1>
      </div>
      <LabOrderForm patients={patients ?? []} catalogue={catalogue ?? []} defaultPatientId={patientId} />
    </div>
  )
}
