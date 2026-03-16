import { notFound } from 'next/navigation'
import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { table, card, statusBadge } from '@/lib/styles'

export const metadata = { title: 'Invoice Detail' }

export default async function PatientInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const [invoiceResult, itemsResult, paymentsResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('patient_id', ctx.patientId)
      .eq('hospital_id', hospitalId)
      .neq('status', 'DRAFT')
      .single(),
    supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order'),
    supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', id)
      .order('paid_at', { ascending: false }),
  ])

  const invoice = invoiceResult.data
  if (!invoice) notFound()

  const items = itemsResult.data ?? []
  const payments = paymentsResult.data ?? []
  const badgeKey = invoice.status as keyof typeof statusBadge

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <a href="/patient/billing" className="text-sm text-neutral-500 hover:text-neutral-700">&larr; Billing</a>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-neutral-900">{invoice.invoice_number}</h1>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[badgeKey] ?? ''}`}>
            {formatLabel(invoice.status)}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className={`${card.base} mb-6`}>
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-neutral-500">Total</dt>
            <dd className="font-bold text-neutral-900 text-lg">{(invoice.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Paid</dt>
            <dd className="font-medium text-success-700">{(invoice.amount_paid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Balance</dt>
            <dd className="font-medium text-error-700">{((invoice.total ?? 0) - (invoice.amount_paid ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Due Date</dt>
            <dd className="font-medium text-neutral-900">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</dd>
          </div>
        </dl>
      </div>

      {/* Line items */}
      {items.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-neutral-900 mb-3">Items</h2>
          <div className={table.wrapper}>
            <table className="min-w-full divide-y divide-neutral-200" aria-label="Invoice items">
              <thead className={table.header}>
                <tr>
                  <th className={table.headerCell}>Description</th>
                  <th className={table.headerCell}>Qty</th>
                  <th className={table.headerCell}>Unit Price</th>
                  <th className={table.headerCell}>Total</th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {items.map((item) => (
                  <tr key={item.id} className={table.row}>
                    <td className={`${table.cell} text-neutral-900`}>{item.description}</td>
                    <td className={`${table.cell} text-neutral-700`}>{item.quantity}</td>
                    <td className={`${table.cell} text-neutral-700`}>{(item.unit_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`${table.cell} text-neutral-900 font-medium`}>{(item.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment history */}
      <h2 className="text-base font-semibold text-neutral-900 mb-3">Payment History</h2>
      {payments.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-center">
          <p className="text-sm text-neutral-600">No payments recorded yet.</p>
        </div>
      ) : (
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="Payment history">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Date</th>
                <th className={table.headerCell}>Method</th>
                <th className={table.headerCell}>Amount</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {payments.map((p) => (
                <tr key={p.id} className={table.row}>
                  <td className={`${table.cell} text-neutral-900`}>{new Date(p.paid_at).toLocaleDateString()}</td>
                  <td className={`${table.cell} text-neutral-700`}>{formatLabel(p.method)}</td>
                  <td className={`${table.cell} text-success-700 font-medium`}>{(p.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
