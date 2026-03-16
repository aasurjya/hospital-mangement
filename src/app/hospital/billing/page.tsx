import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { canCreateBilling, canViewBilling } from '@/lib/billing/permissions'
import { filterBar, table, statusBadge } from '@/lib/styles'
import type { InvoiceStatus } from '@/types/database'

export const metadata = { title: 'Billing' }

const PAGE_SIZE = 25
const STATUSES: InvoiceStatus[] = ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'VOID']

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>
}) {
  const { profile } = await requireAuth()
  if (!canViewBilling(profile.role)) redirect('/unauthorized')
  if (!profile.hospital_id) redirect('/unauthorized')

  const { page: pageStr, status, q } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const showCreate = canCreateBilling(profile.role)

  const supabase = await createSupabaseServerClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('invoices')
    .select(`
      id, invoice_number, status, total, amount_paid, created_at, due_date,
      patients!inner(id, full_name, mrn)
    `, { count: 'exact' })
    .eq('hospital_id', profile.hospital_id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status as InvoiceStatus)
  if (q) {
    // Sanitize search input to prevent PostgREST filter injection
    const safeQ = q.replace(/[%_,.()\[\]]/g, ' ').trim().slice(0, 100)
    if (safeQ) {
      query = query.or(`invoice_number.ilike.%${safeQ}%,patients.full_name.ilike.%${safeQ}%,patients.mrn.ilike.%${safeQ}%`)
    }
  }

  const { data: invoices, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function pageHref(p: number) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Billing <span className="text-sm font-normal text-neutral-600">({count ?? 0})</span>
        </h1>
        {showCreate && (
          <a href="/hospital/billing/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-600 px-5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            New invoice
          </a>
        )}
      </div>

      {/* Search */}
      <form method="GET" className="mb-4">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="billing-search" className="sr-only">Search invoices</label>
        <input
          id="billing-search"
          name="q"
          type="text"
          defaultValue={q ?? ''}
          placeholder="Search by invoice #, patient name, or MRN..."
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </form>

      {/* Filter pills */}
      <div className={`mb-5 ${filterBar.outer}`} role="navigation" aria-label="Filter by status">
        <div className={filterBar.inner}>
          <a href="/hospital/billing"
            aria-current={!status ? 'true' : undefined}
            className={filterBar.pill(!status)}>
            All
          </a>
          {STATUSES.map((s) => (
            <a key={s} href={`?status=${s}${q ? `&q=${q}` : ''}`}
              aria-current={status === s ? 'true' : undefined}
              className={filterBar.pill(status === s)}>
              {formatLabel(s)}
            </a>
          ))}
        </div>
      </div>

      {!invoices?.length ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">
            {status ? `No ${formatLabel(status).toLowerCase()} invoices found.` : 'No invoices found.'}
          </p>
          {status && (
            <a href="/hospital/billing" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
              View all invoices
            </a>
          )}
          {!status && showCreate && (
            <a href="/hospital/billing/new" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
              Create your first invoice
            </a>
          )}
        </div>
      ) : (
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="Invoices">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Invoice #</th>
                <th className={table.headerCell}>Patient</th>
                <th className={table.headerCell}>Status</th>
                <th className={`${table.headerCell} text-right`}>Total</th>
                <th className={`${table.headerCell} text-right hidden sm:table-cell`}>Paid</th>
                <th className={`${table.headerCell} text-right hidden sm:table-cell`}>Balance</th>
                <th className={`${table.headerCell} hidden md:table-cell`}>Date</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {invoices.map((inv) => {
                const patient = inv.patients as unknown as { id: string; full_name: string; mrn: string } | null
                const balance = inv.total - inv.amount_paid
                const badgeCls = statusBadge[inv.status as keyof typeof statusBadge] ?? statusBadge.inactive
                return (
                  <tr key={inv.id} className={table.row}>
                    <td className={`${table.cell} font-mono text-sm`}>
                      <a href={`/hospital/billing/${inv.id}`} className="text-primary-600 hover:text-primary-800">
                        {inv.invoice_number}
                      </a>
                    </td>
                    <td className={`${table.cell} font-medium`}>
                      {patient ? (
                        <>
                          <a href={`/hospital/patients/${patient.id}`} className="text-neutral-900 hover:text-primary-700">
                            {patient.full_name}
                          </a>
                          <div className="mt-0.5 font-mono text-xs text-neutral-500">{patient.mrn}</div>
                        </>
                      ) : '—'}
                    </td>
                    <td className={table.cell}>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
                        {formatLabel(inv.status)}
                      </span>
                    </td>
                    <td className={`${table.cell} text-right font-mono`}>{inv.total.toFixed(2)}</td>
                    <td className={`${table.cell} text-right font-mono hidden sm:table-cell`}>{inv.amount_paid.toFixed(2)}</td>
                    <td className={`${table.cell} text-right font-mono hidden sm:table-cell ${balance > 0 ? 'text-error-600 font-medium' : ''}`}>
                      {balance.toFixed(2)}
                    </td>
                    <td className={`${table.cell} whitespace-nowrap text-neutral-500 hidden md:table-cell`}>
                      {new Date(inv.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={pageHref(page - 1)}
                 aria-label={`Previous page, page ${page - 1}`}
                 className="inline-flex items-center min-h-[44px] rounded-md border px-3 hover:bg-neutral-50">
                Previous
              </a>
            )}
            {page < totalPages && (
              <a href={pageHref(page + 1)}
                 aria-label={`Next page, page ${page + 1}`}
                 className="inline-flex items-center min-h-[44px] rounded-md border px-3 hover:bg-neutral-50">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
