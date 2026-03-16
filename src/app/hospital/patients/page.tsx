import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { table } from '@/lib/styles'

export const metadata = { title: 'Patients' }

const PAGE_SIZE = 25

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const { profile } = await requireAuth()
  const { page: pageStr, q } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))

  const supabase = await createSupabaseServerClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('patients')
    .select('id, mrn, full_name, date_of_birth, gender, phone, is_active', { count: 'exact' })
    .eq('hospital_id', profile.hospital_id!)
    .order('full_name')
    .range(from, to)

  if (q) query = query.ilike('full_name', `%${q}%`)

  const { data: patients, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Responsive header: stacks on mobile */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Patients <span className="text-sm font-normal text-neutral-500">({count ?? 0})</span>
        </h1>
        <a
          href="/hospital/patients/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-600 px-5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          Register patient
        </a>
      </div>

      {/* Search — full-width on mobile */}
      <form method="get" className="mb-5 flex gap-2 sm:max-w-sm">
        <label htmlFor="patient-search" className="sr-only">Search patients by name</label>
        <input
          id="patient-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search by name…"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center rounded-md bg-neutral-100 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
        >
          Search
        </button>
      </form>

      {!patients || patients.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">
            {q ? `No patients match "${q}".` : 'No patients registered yet.'}
          </p>
          {q ? (
            <a href="/hospital/patients" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
              Clear search
            </a>
          ) : (
            <a href="/hospital/patients/new" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
              Register your first patient
            </a>
          )}
        </div>
      ) : (
        /* Horizontal scroll on mobile */
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="Patients">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Name</th>
                <th className={table.headerCell}>MRN</th>
                <th className={`${table.headerCell} hidden sm:table-cell`}>DOB</th>
                <th className={`${table.headerCell} hidden md:table-cell`}>Gender</th>
                <th className={`${table.headerCell} hidden lg:table-cell`}>Phone</th>
                <th className={table.headerCell}>Status</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {patients.map((p) => (
                <tr key={p.id} className={table.row}>
                  <td className={`${table.cell} font-medium`}>
                    <a
                      href={`/hospital/patients/${p.id}`}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      {p.full_name}
                    </a>
                    {/* Mobile: show MRN inline under name */}
                    <div className="mt-0.5 font-mono text-xs text-neutral-500 sm:hidden">{p.mrn}</div>
                  </td>
                  <td className={`${table.cell} hidden font-mono text-neutral-500 sm:table-cell`}>
                    {p.mrn}
                  </td>
                  <td className={`${table.cell} hidden text-neutral-500 sm:table-cell`}>
                    {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : '—'}
                  </td>
                  <td className={`${table.cell} hidden text-neutral-500 md:table-cell`}>
                    {p.gender ? formatLabel(p.gender) : '—'}
                  </td>
                  <td className={`${table.cell} hidden text-neutral-500 lg:table-cell`}>
                    {p.phone ?? '—'}
                  </td>
                  <td className={table.cell}>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.is_active ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
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
              <a
                href={`?page=${page - 1}${q ? `&q=${q}` : ''}`}
                className="inline-flex min-h-[44px] items-center rounded-md border px-4 hover:bg-neutral-50"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?page=${page + 1}${q ? `&q=${q}` : ''}`}
                className="inline-flex min-h-[44px] items-center rounded-md border px-4 hover:bg-neutral-50"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
