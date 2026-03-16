import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canProcessLab } from '@/lib/labs/permissions'
import { formatLabel } from '@/lib/format'
import { LabResultForm } from './lab-result-form'

export const metadata = { title: 'Lab Order Detail' }

export default async function LabOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await requireAuth()
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: order }, { data: results }] = await Promise.all([
    supabase.from('lab_orders').select('*, patients!inner(full_name, mrn)').eq('id', id).eq('hospital_id', profile.hospital_id!).single(),
    supabase.from('lab_results').select('*').eq('lab_order_id', id).order('created_at', { ascending: false }),
  ])

  if (!order) notFound()

  const patient = order.patients as unknown as { full_name: string; mrn: string }
  const canEnterResult = canProcessLab(profile.role) && order.status !== 'COMPLETED' && order.status !== 'CANCELLED'

  const statusColor: Record<string, string> = {
    ORDERED: 'bg-primary-100 text-primary-700',
    SAMPLE_COLLECTED: 'bg-caution-100 text-caution-800',
    PROCESSING: 'bg-secondary-100 text-secondary-700',
    COMPLETED: 'bg-success-100 text-success-700',
    CANCELLED: 'bg-error-100 text-error-700',
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <a href="/hospital/labs" className="text-sm text-neutral-500 hover:text-neutral-700">← Lab Orders</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">{order.order_number}</h1>
        <p className="text-sm text-neutral-500">{patient.full_name} ({patient.mrn})</p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
        {[
          ['Test', order.test_name],
          ['Status', <span key="s" className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[order.status] ?? ''}`}>{formatLabel(order.status)}</span>],
          ['Priority', formatLabel(order.priority)],
          ['Clinical Notes', order.clinical_notes],
          ['Ordered', new Date(order.created_at).toLocaleString()],
          ['Collected', order.collected_at ? new Date(order.collected_at).toLocaleString() : null],
          ['Completed', order.completed_at ? new Date(order.completed_at).toLocaleString() : null],
        ].map(([label, value]) => value ? (
          <div key={label as string} className="flex px-4 py-3 text-sm">
            <span className="w-32 font-medium text-neutral-500">{label}</span>
            <span className="text-neutral-900">{value}</span>
          </div>
        ) : null)}
      </div>

      {/* Results */}
      <div>
        <h2 className="mb-2 text-base font-medium text-neutral-900">Results</h2>
        {(!results || results.length === 0) ? (
          <p className="text-sm text-neutral-400">No results entered yet.</p>
        ) : (
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.id} className={`rounded-lg border p-4 ${r.is_abnormal ? 'border-error-200 bg-error-50' : 'border-neutral-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-semibold ${r.is_abnormal ? 'text-error-700' : 'text-neutral-900'}`}>
                    {r.result_value} {r.unit ?? ''}
                  </span>
                  {r.is_abnormal && (
                    <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-medium text-error-700">Abnormal</span>
                  )}
                </div>
                {r.normal_range && <p className="mt-1 text-sm text-neutral-500">Normal: {r.normal_range}</p>}
                {r.interpretation && <p className="mt-1 text-sm text-neutral-600">{r.interpretation}</p>}
                <p className="mt-1 text-xs text-neutral-400">{new Date(r.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {canEnterResult && <LabResultForm orderId={id} />}
    </div>
  )
}
