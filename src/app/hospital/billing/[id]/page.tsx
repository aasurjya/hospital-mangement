import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { canCreateBilling, canWriteBilling, canVoidInvoice, canViewBilling } from '@/lib/billing/permissions'
import { statusBadge, table } from '@/lib/styles'
import { InvoiceActions } from './invoice-actions'
import { RecordPaymentForm } from './record-payment-form'
import type { InvoiceStatus, PaymentMethod } from '@/types/database'

export const metadata = { title: 'Invoice Detail' }

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await requireAuth()
  if (!canViewBilling(profile.role)) redirect('/unauthorized')
  if (!profile.hospital_id) redirect('/unauthorized')

  const { id } = await params
  const hospitalId = profile.hospital_id

  const supabase = await createSupabaseServerClient()

  // Fetch invoice first to confirm ownership, then items & payments
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      *,
      patients!inner(id, full_name, mrn),
      user_profiles!invoices_created_by_fkey(full_name)
    `)
    .eq('id', id)
    .eq('hospital_id', hospitalId)
    .single()

  if (!invoice) notFound()

  // Now fetch items and payments (invoice ownership confirmed)
  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order'),
    supabase
      .from('payments')
      .select(`
        *,
        user_profiles!payments_recorded_by_fkey(full_name)
      `)
      .eq('invoice_id', id)
      .eq('hospital_id', hospitalId)
      .order('paid_at', { ascending: false }),
  ])

  const patient = invoice.patients as unknown as { id: string; full_name: string; mrn: string }
  const creator = invoice.user_profiles as unknown as { full_name: string } | null
  const balance = invoice.total - invoice.amount_paid
  const badgeCls = statusBadge[invoice.status as keyof typeof statusBadge] ?? statusBadge.inactive

  const showIssue = invoice.status === 'DRAFT' && canWriteBilling(profile.role)
  const showVoid = invoice.status !== 'VOID' && canVoidInvoice(profile.role)
  const showPayment = ['ISSUED', 'PARTIAL'].includes(invoice.status) && canCreateBilling(profile.role)

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      {/* Header */}
      <div>
        <a href="/hospital/billing" className="text-sm text-neutral-500 hover:text-neutral-700">&larr; Billing</a>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{invoice.invoice_number}</h1>
            <p className="text-sm text-neutral-600 mt-0.5">
              <a href={`/hospital/patients/${patient.id}`} className="text-primary-600 hover:text-primary-800">
                {patient.full_name}
              </a>{' '}
              <span className="font-mono text-neutral-400">({patient.mrn})</span>
            </p>
          </div>
          <span className={`inline-flex self-start rounded-full px-3 py-1 text-sm font-medium ${badgeCls}`}>
            {formatLabel(invoice.status)}
          </span>
        </div>
      </div>

      {/* Meta info */}
      <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
        {[
          ['Created', new Date(invoice.created_at).toLocaleDateString()],
          invoice.issued_at ? ['Issued', new Date(invoice.issued_at).toLocaleDateString()] : null,
          invoice.due_date ? ['Due', new Date(invoice.due_date).toLocaleDateString()] : null,
          creator ? ['Created by', creator.full_name] : null,
          invoice.notes ? ['Notes', invoice.notes] : null,
        ].filter((x): x is [string, string] => x !== null).map(([label, value]) => (
          <div key={label as string} className="flex px-4 py-3 text-sm">
            <span className="w-28 font-medium text-neutral-500">{label}</span>
            <span className="text-neutral-900">{value}</span>
          </div>
        ))}
      </div>

      {/* Line items */}
      <div>
        <h2 className="text-base font-medium text-neutral-900 mb-2">Line items</h2>
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="Invoice line items">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Description</th>
                <th className={`${table.headerCell} text-right`}>Qty</th>
                <th className={`${table.headerCell} text-right`}>Unit price</th>
                <th className={`${table.headerCell} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {(items ?? []).map((item) => (
                <tr key={item.id} className={table.row}>
                  <td className={table.cell}>{item.description}</td>
                  <td className={`${table.cell} text-right font-mono`}>{item.quantity}</td>
                  <td className={`${table.cell} text-right font-mono`}>{item.unit_price.toFixed(2)}</td>
                  <td className={`${table.cell} text-right font-mono`}>{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">Subtotal</span>
          <span className="font-mono">{invoice.subtotal.toFixed(2)}</span>
        </div>
        {invoice.tax_rate > 0 && (
          <div className="flex justify-between">
            <span className="text-neutral-600">Tax ({(invoice.tax_rate * 100).toFixed(2)}%)</span>
            <span className="font-mono">{invoice.tax_amount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-medium text-neutral-900 border-t border-neutral-200 pt-2">
          <span>Total</span>
          <span className="font-mono">{invoice.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Amount paid</span>
          <span className="font-mono text-success-700">{invoice.amount_paid.toFixed(2)}</span>
        </div>
        <div className={`flex justify-between font-medium border-t border-neutral-200 pt-2 ${balance > 0 ? 'text-error-700' : 'text-neutral-900'}`}>
          <span>Balance due</span>
          <span className="font-mono">{balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Action buttons */}
      {(showIssue || showVoid) && (
        <InvoiceActions
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoice_number}
          showIssue={showIssue}
          showVoid={showVoid}
        />
      )}

      {/* Record payment form */}
      {showPayment && (
        <div>
          <h2 className="text-base font-medium text-neutral-900 mb-2">Record payment</h2>
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <RecordPaymentForm invoiceId={invoice.id} balance={balance} />
          </div>
        </div>
      )}

      {/* Payment history */}
      {payments && payments.length > 0 && (
        <div>
          <h2 className="text-base font-medium text-neutral-900 mb-2">Payment history</h2>
          <div className={table.wrapper}>
            <table className="min-w-full divide-y divide-neutral-200" aria-label="Payment history">
              <thead className={table.header}>
                <tr>
                  <th className={table.headerCell}>Date</th>
                  <th className={`${table.headerCell} text-right`}>Amount</th>
                  <th className={table.headerCell}>Method</th>
                  <th className={`${table.headerCell} hidden sm:table-cell`}>Reference</th>
                  <th className={`${table.headerCell} hidden md:table-cell`}>Recorded by</th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {payments.map((p) => {
                  const recorder = p.user_profiles as unknown as { full_name: string } | null
                  return (
                    <tr key={p.id} className={table.row}>
                      <td className={`${table.cell} whitespace-nowrap`}>
                        {new Date(p.paid_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className={`${table.cell} text-right font-mono font-medium text-success-700`}>
                        {p.amount.toFixed(2)}
                      </td>
                      <td className={table.cell}>{formatLabel(p.method as PaymentMethod)}</td>
                      <td className={`${table.cell} hidden sm:table-cell text-neutral-500`}>{p.reference ?? '—'}</td>
                      <td className={`${table.cell} hidden md:table-cell text-neutral-500`}>{recorder?.full_name ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
