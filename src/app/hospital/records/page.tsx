import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { filterBar, table } from '@/lib/styles'
import type { RecordStatus } from '@/types/database'

export const metadata = { title: 'Medical Records' }

type RecordRow = {
  id: string
  created_at: string
  status: RecordStatus
  chief_complaint: string | null
  patients: { id: string; full_name: string; mrn: string } | null
  user_profiles: { full_name: string } | null
}

const PAGE_SIZE = 25
const STATUSES: RecordStatus[] = ['DRAFT', 'FINALIZED']

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { profile } = await requireAuth()
  const { page: pageStr, status } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))

  const supabase = await createSupabaseServerClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('medical_records')
    .select(`
      id, created_at, status, chief_complaint,
      patients!inner(id, full_name, mrn),
      user_profiles!medical_records_author_id_fkey(full_name)
    `, { count: 'exact' })
    .eq('hospital_id', profile.hospital_id!)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status as RecordStatus)

  const { data: rawRecords, count } = await query
  const records = (rawRecords ?? []) as unknown as RecordRow[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function pageHref(p: number) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Medical Records <span className="text-sm font-normal text-neutral-500">({count ?? 0})</span>
        </h1>
        <a
          href="/hospital/records/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-600 px-5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          New record
        </a>
      </div>

      {/* Horizontally scrollable filter pills on mobile */}
      <div className={`mb-5 ${filterBar.outer}`} role="navigation" aria-label="Filter by status">
        <div className={filterBar.inner}>
          <a href="/hospital/records" aria-current={!status ? 'true' : undefined}
            className={filterBar.pill(!status)}>
            All
          </a>
          {STATUSES.map((s) => (
            <a key={s} href={`?status=${s}`} aria-current={status === s ? 'true' : undefined}
              className={filterBar.pill(status === s)}>
              {formatLabel(s)}
            </a>
          ))}
        </div>
      </div>

      {!records.length ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">
            {status ? `No ${formatLabel(status).toLowerCase()} records.` : 'No medical records found.'}
          </p>
          {status && (
            <a href="/hospital/records" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
              View all records
            </a>
          )}
        </div>
      ) : (
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="Medical records">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Date</th>
                <th className={table.headerCell}>Patient</th>
                <th className={`${table.headerCell} hidden sm:table-cell`}>Doctor</th>
                <th className={`${table.headerCell} hidden md:table-cell`}>Chief Complaint</th>
                <th className={table.headerCell}>Status</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {records.map((r) => (
                <tr key={r.id} className={table.row}>
                  <td className={`${table.cell} whitespace-nowrap text-neutral-500`}>
                    {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </td>
                  <td className={table.cell}>
                    {r.patients ? (
                      <>
                        <a href={`/hospital/patients/${r.patients.id}`}
                          className="font-medium text-primary-600 hover:text-primary-800">
                          {r.patients.full_name}
                        </a>
                        {/* Mobile: show doctor inline */}
                        <div className="mt-0.5 text-xs text-neutral-500 sm:hidden">{r.user_profiles?.full_name}</div>
                      </>
                    ) : '—'}
                  </td>
                  <td className={`${table.cell} hidden text-neutral-600 sm:table-cell`}>
                    {r.user_profiles?.full_name ?? '—'}
                  </td>
                  <td className={`${table.cell} hidden max-w-[200px] truncate text-neutral-600 md:table-cell`}>
                    {r.chief_complaint ?? '—'}
                  </td>
                  <td className={table.cell}>
                    <a href={`/hospital/records/${r.id}`}
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === 'FINALIZED'
                          ? 'bg-success-100 text-success-700'
                          : 'bg-caution-100 text-caution-700'
                      }`}>
                      {formatLabel(r.status)}
                    </a>
                  </td>
                </tr>
              ))}
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
                className="inline-flex min-h-[44px] items-center rounded-md border px-4 hover:bg-neutral-50">
                Previous
              </a>
            )}
            {page < totalPages && (
              <a href={pageHref(page + 1)}
                className="inline-flex min-h-[44px] items-center rounded-md border px-4 hover:bg-neutral-50">
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
