import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { AdmissionRows } from './admission-rows'
import { filterBar } from '@/lib/styles'
import type { AdmissionStatus } from '@/types/database'

export const metadata = { title: 'Admissions' }

const PAGE_SIZE = 25
const STATUS_LABELS: Record<string, string> = {
  ADMITTED: 'Currently Admitted',
  DISCHARGED: 'Discharged',
  TRANSFERRED: 'Transferred',
}

export default async function AdmissionsPage({
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
    .from('admissions')
    .select(`
      id, admitted_at, discharged_at, status, reason, bed_number,
      patients!inner(id, full_name, mrn),
      user_profiles!admissions_doctor_id_fkey(full_name),
      departments!admissions_department_id_fkey(name)
    `, { count: 'exact' })
    .eq('hospital_id', profile.hospital_id!)
    .order('admitted_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status as AdmissionStatus)

  const { data: admissions, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const STATUSES = ['ADMITTED', 'DISCHARGED', 'TRANSFERRED']

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
          Admissions <span className="text-sm font-normal text-neutral-600">({count ?? 0})</span>
        </h1>
        <a href="/hospital/admissions/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-600 px-5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
          Admit patient
        </a>
      </div>

      {/* Horizontally scrollable filter pills on mobile */}
      <div className={`mb-5 ${filterBar.outer}`} role="navigation" aria-label="Filter by status">
        <div className={filterBar.inner}>
          <a href="/hospital/admissions"
            aria-current={!status ? 'true' : undefined}
            className={filterBar.pill(!status)}>
            All
          </a>
          {STATUSES.map((s) => (
            <a key={s} href={`?status=${s}`}
              aria-current={status === s ? 'true' : undefined}
              className={filterBar.pill(status === s)}>
              {STATUS_LABELS[s] ?? formatLabel(s)}
            </a>
          ))}
        </div>
      </div>

      {!admissions?.length ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">
            {status ? `No ${STATUS_LABELS[status]?.toLowerCase() ?? status.toLowerCase()} admissions found.` : 'No admissions found.'}
          </p>
          {status && (
            <a href="/hospital/admissions" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
              View all admissions
            </a>
          )}
          {!status && (
            <a href="/hospital/admissions/new" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
              Admit your first patient
            </a>
          )}
        </div>
      ) : (
        <AdmissionRows admissions={admissions as unknown as AdmissionRow[]} />
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

export type AdmissionRow = {
  id: string
  admitted_at: string
  discharged_at: string | null
  status: string
  reason: string | null
  bed_number: string | null
  patients: { id: string; full_name: string; mrn: string } | null
  user_profiles: { full_name: string } | null
  departments: { name: string } | null
}
