import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canOrderLab, canProcessLab } from '@/lib/labs/permissions'
import { formatLabel } from '@/lib/format'
import { btn, table as t } from '@/lib/styles'
import Link from 'next/link'
import { LabOrderStatusActions } from './lab-order-status-actions'

export const metadata = { title: 'Lab Orders' }

export default async function LabOrdersPage() {
  const { profile } = await requireAuth()
  const supabase = await createSupabaseServerClient()

  const { data: orders } = await supabase
    .from('lab_orders')
    .select('*, patients!inner(full_name, mrn)')
    .eq('hospital_id', profile.hospital_id!)
    .order('created_at', { ascending: false })
    .limit(50)

  const showCreate = canOrderLab(profile.role)
  const showProcess = canProcessLab(profile.role)

  const priorityColor: Record<string, string> = {
    ROUTINE: 'bg-neutral-100 text-neutral-600',
    URGENT: 'bg-caution-100 text-caution-800',
    STAT: 'bg-error-100 text-error-700',
  }

  const statusColor: Record<string, string> = {
    ORDERED: 'bg-primary-100 text-primary-700',
    SAMPLE_COLLECTED: 'bg-caution-100 text-caution-800',
    PROCESSING: 'bg-secondary-100 text-secondary-700',
    COMPLETED: 'bg-success-100 text-success-700',
    CANCELLED: 'bg-error-100 text-error-700',
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Lab Orders</h1>
        <div className="flex gap-2">
          {showCreate && (
            <Link href="/hospital/labs/new" className={btn.primary}>+ New Order</Link>
          )}
          <Link href="/hospital/labs/catalogue" className={btn.secondary}>Catalogue</Link>
        </div>
      </div>

      <div className={t.wrapper}>
        <table className="w-full" aria-label="Lab orders">
          <thead className={t.header}>
            <tr>
              <th className={t.headerCell}>Order #</th>
              <th className={t.headerCell}>Patient</th>
              <th className={t.headerCell}>Test</th>
              <th className={t.headerCell}>Priority</th>
              <th className={t.headerCell}>Status</th>
              <th className={t.headerCell}>Date</th>
              {showProcess && <th className={t.headerCell}>Actions</th>}
            </tr>
          </thead>
          <tbody className={t.body}>
            {(!orders || orders.length === 0) && (
              <tr><td colSpan={showProcess ? 7 : 6} className="px-4 py-6 text-center text-sm text-neutral-400">No lab orders found.</td></tr>
            )}
            {orders?.map((o) => {
              const patient = o.patients as unknown as { full_name: string; mrn: string }
              return (
                <tr key={o.id} className={t.row}>
                  <td className={t.cell}>
                    <Link href={`/hospital/labs/${o.id}`} className="font-mono text-primary-600 hover:text-primary-800">
                      {o.order_number}
                    </Link>
                  </td>
                  <td className={t.cell}>
                    <div className="font-medium text-neutral-900">{patient.full_name}</div>
                    <div className="text-xs font-mono text-neutral-400">{patient.mrn}</div>
                  </td>
                  <td className={t.cell}>{o.test_name}</td>
                  <td className={t.cell}>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor[o.priority] ?? ''}`}>
                      {formatLabel(o.priority)}
                    </span>
                  </td>
                  <td className={t.cell}>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[o.status] ?? ''}`}>
                      {formatLabel(o.status)}
                    </span>
                  </td>
                  <td className={`${t.cell} whitespace-nowrap`}>{new Date(o.created_at).toLocaleDateString()}</td>
                  {showProcess && (
                    <td className={t.cell}>
                      <LabOrderStatusActions orderId={o.id} status={o.status} />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
