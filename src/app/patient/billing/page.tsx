import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { table, statusBadge } from '@/lib/styles'
import Link from 'next/link'

export const metadata = { title: 'My Billing' }

export default async function PatientBillingPage() {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, status, total, amount_paid, created_at, due_date')
    .eq('patient_id', ctx.patientId)
    .eq('hospital_id', hospitalId)
    .neq('status', 'DRAFT')
    .order('created_at', { ascending: false })

  const outstanding = (invoices ?? [])
    .filter((inv) => inv.status === 'ISSUED' || inv.status === 'PARTIAL')
    .reduce((sum, inv) => sum + ((inv.total ?? 0) - (inv.amount_paid ?? 0)), 0)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">My Billing</h1>
        {outstanding > 0 && (
          <p className="mt-1 text-sm text-error-700">
            Outstanding balance: <strong>{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </p>
        )}
      </div>

      {!invoices || invoices.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">No invoices found.</p>
        </div>
      ) : (
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="My invoices">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Invoice</th>
                <th className={table.headerCell}>Date</th>
                <th className={`${table.headerCell} hidden sm:table-cell`}>Due</th>
                <th className={table.headerCell}>Total</th>
                <th className={`${table.headerCell} hidden sm:table-cell`}>Paid</th>
                <th className={table.headerCell}>Status</th>
                <th className={table.headerCell}><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {invoices.map((inv) => {
                const badgeKey = inv.status as keyof typeof statusBadge
                return (
                  <tr key={inv.id} className={table.row}>
                    <td className={`${table.cell} font-medium text-neutral-900`}>{inv.invoice_number}</td>
                    <td className={`${table.cell} text-neutral-700`}>{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className={`${table.cell} text-neutral-600 hidden sm:table-cell`}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '\u2014'}</td>
                    <td className={`${table.cell} text-neutral-900 font-medium`}>{(inv.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`${table.cell} text-neutral-700 hidden sm:table-cell`}>{(inv.amount_paid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={table.cell}>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[badgeKey] ?? ''}`}>
                        {formatLabel(inv.status)}
                      </span>
                    </td>
                    <td className={table.cell}>
                      <Link href={`/patient/billing/${inv.id}`} className="text-sm text-primary-600 hover:text-primary-800 min-h-[44px] inline-flex items-center">
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
