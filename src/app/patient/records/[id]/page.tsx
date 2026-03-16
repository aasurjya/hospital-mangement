import { notFound } from 'next/navigation'
import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { card } from '@/lib/styles'
import { PrintButton } from './print-button'

export const metadata = { title: 'Medical Record' }

export default async function PatientRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const { data: record } = await supabase
    .from('medical_records')
    .select('id, visit_date, chief_complaint, notes, status, finalized_at, user_profiles!medical_records_author_id_fkey(full_name)')
    .eq('id', id)
    .eq('patient_id', ctx.patientId)
    .eq('hospital_id', hospitalId)
    .eq('status', 'FINALIZED')
    .single()

  if (!record) notFound()

  const author = record.user_profiles as { full_name: string } | null

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <a href="/patient/records" className="text-sm text-neutral-500 hover:text-neutral-700">&larr; Records</a>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Medical Record</h1>
        </div>
        <PrintButton />
      </div>

      <div className={card.base}>
        <dl className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Visit Date</dt>
              <dd className="mt-1 text-sm font-medium text-neutral-900">{new Date(record.visit_date).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Doctor</dt>
              <dd className="mt-1 text-sm font-medium text-neutral-900">{author?.full_name ?? 'N/A'}</dd>
            </div>
            {record.finalized_at && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Finalized</dt>
                <dd className="mt-1 text-sm font-medium text-neutral-900">{new Date(record.finalized_at).toLocaleDateString()}</dd>
              </div>
            )}
          </div>

          {record.chief_complaint && (
            <div className="border-t border-neutral-100 pt-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Chief Complaint</dt>
              <dd className="mt-1 text-sm text-neutral-900">{record.chief_complaint}</dd>
            </div>
          )}

          {record.notes && (
            <div className="border-t border-neutral-100 pt-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">Notes</dt>
              <dd className="mt-1 text-sm text-neutral-900 whitespace-pre-wrap">{record.notes}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}
