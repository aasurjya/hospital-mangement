import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canCreateBilling } from '@/lib/billing/permissions'
import { redirect } from 'next/navigation'
import { NewInvoiceForm } from './new-invoice-form'

export const metadata = { title: 'New Invoice' }

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const { profile } = await requireAuth()
  if (!canCreateBilling(profile.role)) redirect('/unauthorized')

  const { patientId } = await searchParams
  const supabase = await createSupabaseServerClient()
  const hospitalId = profile.hospital_id!

  const [
    { data: patients },
    { data: admissions },
    { data: appointments },
    { data: preselectedPatient },
  ] = await Promise.all([
    supabase
      .from('patients')
      .select('id, full_name, mrn')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('full_name')
      .limit(200),
    supabase
      .from('admissions')
      .select('id, patient_id, reason, admitted_at')
      .eq('hospital_id', hospitalId)
      .eq('status', 'ADMITTED')
      .order('admitted_at', { ascending: false }),
    supabase
      .from('appointments')
      .select('id, patient_id, reason, scheduled_at')
      .eq('hospital_id', hospitalId)
      .in('status', ['COMPLETED', 'CONFIRMED'])
      .order('scheduled_at', { ascending: false })
      .limit(50),
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
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <a href="/hospital/billing" className="text-sm text-neutral-500 hover:text-neutral-700">&larr; Billing</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">New invoice</h1>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <NewInvoiceForm
          patients={patients ?? []}
          admissions={admissions ?? []}
          appointments={appointments ?? []}
          preselectedPatient={preselectedPatient ?? null}
        />
      </div>
    </div>
  )
}
