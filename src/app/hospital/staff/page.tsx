import { requireHospitalAdmin } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { table } from '@/lib/styles'

export const metadata = { title: 'Staff' }

const PAGE_SIZE = 20

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { profile } = await requireHospitalAdmin()
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))

  const supabase = await createSupabaseServerClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: staff, count } = await supabase
    .from('user_profiles')
    .select('id, full_name, role, phone, is_active, created_at', { count: 'exact' })
    .eq('hospital_id', profile.hospital_id!)
    .neq('role', 'PATIENT')
    .order('full_name')
    .range(from, to)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Staff <span className="text-sm font-normal text-neutral-600">({count ?? 0})</span>
        </h1>
        <a href="/hospital/staff/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-600 px-5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
          Add staff member
        </a>
      </div>

      {!staff || staff.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">No staff members yet.</p>
          <a href="/hospital/staff/new" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
            Add your first staff member
          </a>
        </div>
      ) : (
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="Staff members">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Name</th>
                <th className={table.headerCell}>Role</th>
                <th className={`${table.headerCell} hidden md:table-cell`}>Phone</th>
                <th className={table.headerCell}>Status</th>
                <th className={`${table.headerCell} hidden lg:table-cell`}>Added</th>
                <th className={table.headerCell}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {staff.map((s) => (
                <tr key={s.id} className={`${table.row} ${!s.is_active ? 'opacity-60' : ''}`}>
                  <td className={`${table.cell} font-medium text-neutral-900`}>
                    {s.full_name}
                    {/* Mobile: show role inline */}
                    <div className="mt-0.5 text-xs text-neutral-500 sm:hidden">{formatLabel(s.role)}</div>
                  </td>
                  <td className={`${table.cell} hidden text-neutral-600 sm:table-cell`}>{formatLabel(s.role)}</td>
                  <td className={`${table.cell} hidden text-neutral-600 md:table-cell`}>{s.phone ?? '—'}</td>
                  <td className={table.cell}>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.is_active ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className={`${table.cell} hidden text-neutral-600 lg:table-cell`}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className={table.cell}>
                    {s.role !== 'PLATFORM_ADMIN' ? (
                      <a href={`/hospital/staff/${s.id}/edit`}
                         className="inline-flex min-h-[44px] items-center px-1 text-sm font-medium text-primary-600 hover:text-primary-800">
                        Edit
                      </a>
                    ) : <span className="text-neutral-400">—</span>}
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
              <a href={`?page=${page - 1}`}
                 aria-label={`Previous page, page ${page - 1}`}
                 className="inline-flex items-center min-h-[44px] rounded-md border px-3 hover:bg-neutral-50">
                Previous
              </a>
            )}
            {page < totalPages && (
              <a href={`?page=${page + 1}`}
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
