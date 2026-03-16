import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { table, statusBadge, btn, filterBar } from '@/lib/styles'
import { AppointmentCancelButton } from './cancel-button'

export const metadata = { title: 'My Appointments' }

const PAGE_SIZE = 25
const STATUS_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export default async function PatientAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!
  const { page: pageStr, status } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('appointments')
    .select('id, scheduled_at, status, reason, duration_minutes, user_profiles!appointments_doctor_id_fkey(full_name), departments(name)', { count: 'exact' })
    .eq('patient_id', ctx.patientId)
    .eq('hospital_id', hospitalId)
    .order('scheduled_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (status) query = query.eq('status', status as 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW')

  const { data: appointments, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const values = { status, ...overrides }
    for (const [k, v] of Object.entries(values)) {
      if (v) params.set(k, v)
    }
    return params.size > 0 ? `?${params.toString()}` : '/patient/appointments'
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          My Appointments <span className="text-sm font-normal text-neutral-600">({count ?? 0})</span>
        </h1>
        <a href="/patient/appointments/new" className={btn.primary}>
          Request Appointment
        </a>
      </div>

      <div className="mb-4">
        <div className="flex gap-2" role="navigation" aria-label="Filter by status">
          {STATUS_FILTERS.map(({ label, value }) => {
            const isActive = status === value || (!status && !value)
            return (
              <a key={label} href={buildHref({ status: value, page: undefined })}
                aria-current={isActive ? 'true' : undefined}
                className={filterBar.pill(isActive)}>
                {label}
              </a>
            )
          })}
        </div>
      </div>

      {!appointments || appointments.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">No appointments found.</p>
          <a href="/patient/appointments/new" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
            Request your first appointment
          </a>
        </div>
      ) : (
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="My appointments">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Date &amp; Time</th>
                <th className={`${table.headerCell} hidden sm:table-cell`}>Doctor</th>
                <th className={`${table.headerCell} hidden md:table-cell`}>Reason</th>
                <th className={table.headerCell}>Status</th>
                <th className={table.headerCell}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {appointments.map((appt) => {
                const doctor = appt.user_profiles as { full_name: string } | null
                const badgeKey = appt.status as keyof typeof statusBadge
                return (
                  <tr key={appt.id} className={table.row}>
                    <td className={`${table.cell} font-medium text-neutral-900`}>
                      {new Date(appt.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      <div className="text-xs text-neutral-500">
                        {new Date(appt.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {doctor && <div className="text-xs text-neutral-500 sm:hidden">{doctor.full_name}</div>}
                    </td>
                    <td className={`${table.cell} text-neutral-700 hidden sm:table-cell`}>{doctor?.full_name ?? '\u2014'}</td>
                    <td className={`${table.cell} text-neutral-600 hidden md:table-cell`}>{appt.reason ?? '\u2014'}</td>
                    <td className={table.cell}>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[badgeKey] ?? statusBadge.inactive}`}>
                        {formatLabel(appt.status)}
                      </span>
                    </td>
                    <td className={table.cell}>
                      {appt.status === 'SCHEDULED' && (
                        <AppointmentCancelButton appointmentId={appt.id} />
                      )}
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
              <a href={buildHref({ page: String(page - 1) })}
                className="inline-flex items-center min-h-[44px] rounded-md border px-3 hover:bg-neutral-50">Previous</a>
            )}
            {page < totalPages && (
              <a href={buildHref({ page: String(page + 1) })}
                className="inline-flex items-center min-h-[44px] rounded-md border px-3 hover:bg-neutral-50">Next</a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
