import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { MedicationOrderActions } from './medication-order-actions'

export const metadata = { title: 'Prescription Detail' }

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await requireAuth()
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: rx }, { data: orders }] = await Promise.all([
    supabase.from('prescriptions').select('*, patients!inner(full_name, mrn)').eq('id', id).eq('hospital_id', profile.hospital_id!).single(),
    supabase.from('medication_orders').select('*').eq('prescription_id', id).order('created_at', { ascending: false }),
  ])

  if (!rx) notFound()

  const patient = rx.patients as unknown as { full_name: string; mrn: string }

  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-primary-100 text-primary-700',
    COMPLETED: 'bg-success-100 text-success-700',
    CANCELLED: 'bg-error-100 text-error-700',
    DISCONTINUED: 'bg-neutral-100 text-neutral-500',
    ORDERED: 'bg-primary-100 text-primary-700',
    DISPENSED: 'bg-caution-100 text-caution-800',
    ADMINISTERED: 'bg-success-100 text-success-700',
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <a href="/hospital/prescriptions" className="text-sm text-neutral-500 hover:text-neutral-700">← Prescriptions</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">{rx.drug_name}</h1>
        <p className="text-sm text-neutral-500">{patient.full_name} ({patient.mrn})</p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
        {[
          ['Status', <span key="s" className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[rx.status] ?? ''}`}>{formatLabel(rx.status)}</span>],
          ['Dosage', rx.dosage],
          ['Route', formatLabel(rx.route)],
          ['Frequency', rx.frequency],
          ['Duration', rx.duration],
          ['Quantity', rx.quantity],
          ['Refills', rx.refills],
          ['Notes', rx.notes],
        ].map(([label, value]) => value ? (
          <div key={label as string} className="flex px-4 py-3 text-sm">
            <span className="w-32 font-medium text-neutral-500">{label}</span>
            <span className="text-neutral-900">{value}</span>
          </div>
        ) : null)}
        {rx.allergy_override && (
          <div className="flex px-4 py-3 text-sm bg-error-50">
            <span className="w-32 font-medium text-error-600">Allergy Override</span>
            <span className="text-error-700">{rx.allergy_override_reason || 'No reason provided'}</span>
          </div>
        )}
      </div>

      {/* Medication orders */}
      <div>
        <h2 className="mb-2 text-base font-medium text-neutral-900">Medication Orders</h2>
        <div className="space-y-2">
          {(!orders || orders.length === 0) && (
            <p className="text-sm text-neutral-400">No orders yet.</p>
          )}
          {orders?.map((order) => (
            <div key={order.id} className="rounded-lg border border-neutral-200 bg-white p-4 flex items-center justify-between">
              <div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[order.status] ?? ''}`}>
                  {formatLabel(order.status)}
                </span>
                <span className="ml-2 text-sm text-neutral-500">
                  {new Date(order.created_at).toLocaleString()}
                </span>
                {order.dispensed_at && (
                  <span className="ml-2 text-xs text-neutral-400">
                    Dispensed: {new Date(order.dispensed_at).toLocaleString()}
                  </span>
                )}
                {order.administered_at && (
                  <span className="ml-2 text-xs text-neutral-400">
                    Administered: {new Date(order.administered_at).toLocaleString()}
                  </span>
                )}
              </div>
              <MedicationOrderActions orderId={order.id} status={order.status} userRole={profile.role} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
