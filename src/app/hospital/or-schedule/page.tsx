import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { table, btn } from '@/lib/styles'
import type { OrCaseStatus } from '@/types/database'

export const metadata = { title: 'OR Schedule' }

const STATUS_BADGE: Record<OrCaseStatus, string> = {
  SCHEDULED: 'bg-primary-100 text-primary-700',
  IN_PROGRESS: 'bg-secondary-100 text-secondary-700',
  COMPLETED: 'bg-success-100 text-success-700',
  CANCELLED: 'bg-error-100 text-error-700',
}

type ViewMode = 'day' | 'week'

function getDateRange(date: string, mode: ViewMode): { start: string; end: string } {
  const d = new Date(date)
  if (mode === 'day') {
    const iso = d.toISOString().slice(0, 10)
    return { start: `${iso}T00:00:00`, end: `${iso}T23:59:59` }
  }
  // week: Monday–Sunday
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: `${monday.toISOString().slice(0, 10)}T00:00:00`,
    end: `${sunday.toISOString().slice(0, 10)}T23:59:59`,
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default async function OrSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string; status?: string }>
}) {
  const { profile } = await requireAuth()
  const { date, view: viewParam, status } = await searchParams

  const today = new Date().toISOString().slice(0, 10)
  const selectedDate = date ?? today
  const viewMode: ViewMode = viewParam === 'week' ? 'week' : 'day'

  const hospitalId = profile.hospital_id!
  const canSchedule = profile.role === 'DOCTOR' || profile.role === 'HOSPITAL_ADMIN'

  const { start, end } = getDateRange(selectedDate, viewMode)

  const supabase = await createSupabaseServerClient()

  // Build OR cases query
  let casesQuery = supabase
    .from('or_cases')
    .select(`
      id,
      patient_id,
      room_id,
      procedure_name,
      procedure_code,
      scheduled_start,
      scheduled_end,
      actual_start,
      actual_end,
      status,
      anesthesia_type,
      pre_op_notes,
      post_op_notes,
      patients!patient_id (full_name, mrn),
      rooms!room_id (room_number, room_type),
      user_profiles!primary_surgeon_id (full_name)
    `)
    .eq('hospital_id', hospitalId)
    .gte('scheduled_start', start)
    .lte('scheduled_start', end)
    .order('scheduled_start')

  if (status) {
    casesQuery = casesQuery.eq('status', status as OrCaseStatus)
  }

  const { data: cases } = await casesQuery

  // Navigation helpers
  const prevDate = new Date(selectedDate)
  prevDate.setDate(prevDate.getDate() - (viewMode === 'week' ? 7 : 1))
  const nextDate = new Date(selectedDate)
  nextDate.setDate(nextDate.getDate() + (viewMode === 'week' ? 7 : 1))

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const values = { date: selectedDate, view: viewMode, status, ...overrides }
    for (const [k, v] of Object.entries(values)) {
      if (v) params.set(k, v)
    }
    return `?${params.toString()}`
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">OR Schedule</h1>
        {canSchedule && (
          <a href="/hospital/or-schedule/new" className={btn.primary}>
            Schedule Case
          </a>
        )}
      </div>

      {/* View mode + date navigation */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* View toggle */}
        <div className="flex rounded-md border border-neutral-200 overflow-hidden">
          <a
            href={buildHref({ view: 'day' })}
            aria-current={viewMode === 'day' ? 'true' : undefined}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'day'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            Day
          </a>
          <a
            href={buildHref({ view: 'week' })}
            aria-current={viewMode === 'week' ? 'true' : undefined}
            className={`px-4 py-2 text-sm font-medium border-l border-neutral-200 transition-colors ${
              viewMode === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            Week
          </a>
        </div>

        {/* Date navigation */}
        <a
          href={buildHref({ date: prevDate.toISOString().slice(0, 10) })}
          className={btn.secondary}
          aria-label={`Previous ${viewMode}`}
        >
          ← Prev
        </a>
        <span className="text-sm font-medium text-neutral-700">
          {viewMode === 'day'
            ? formatDate(`${selectedDate}T12:00:00`)
            : `Week of ${formatDate(`${start}`)}`}
        </span>
        <a
          href={buildHref({ date: nextDate.toISOString().slice(0, 10) })}
          className={btn.secondary}
          aria-label={`Next ${viewMode}`}
        >
          Next →
        </a>
        <a
          href={buildHref({ date: today })}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-primary-300 px-4 text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
        >
          Today
        </a>
      </div>

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2" role="navigation" aria-label="Filter by status">
        {[
          { label: 'All', value: undefined },
          { label: 'Scheduled', value: 'SCHEDULED' },
          { label: 'In Progress', value: 'IN_PROGRESS' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ].map(({ label, value }) => {
          const isActive = status === value || (!status && !value)
          return (
            <a
              key={label}
              href={buildHref({ status: value })}
              aria-current={isActive ? 'true' : undefined}
              className={`inline-flex items-center min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {label}
            </a>
          )
        })}
      </div>

      {/* Cases table */}
      {(!cases || cases.length === 0) ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-500">No OR cases scheduled for this period.</p>
          {canSchedule && (
            <a href="/hospital/or-schedule/new" className={`mt-4 inline-block ${btn.primary}`}>
              Schedule a Case
            </a>
          )}
        </div>
      ) : (
        <div className={table.wrapper}>
          <table className="min-w-full" aria-label="OR schedule">
            <thead className={table.header}>
              <tr>
                {['Time', 'Room', 'Patient', 'Procedure', 'Surgeon', 'Anesthesia', 'Status'].map((h) => (
                  <th key={h} scope="col" className={table.headerCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={table.body}>
              {cases.map((orCase) => {
                const patient = orCase.patients as unknown as { full_name: string; mrn: string } | null
                const room = orCase.rooms as unknown as { room_number: string; room_type: string } | null
                const surgeon = orCase.user_profiles as unknown as { full_name: string } | null
                const caseStatus = orCase.status as OrCaseStatus

                return (
                  <tr key={orCase.id} className={table.row}>
                    <td className={table.cell}>
                      <p className="font-medium text-neutral-800 whitespace-nowrap">
                        {formatTime(orCase.scheduled_start)}
                      </p>
                      <p className="text-xs text-neutral-500 whitespace-nowrap">
                        → {formatTime(orCase.scheduled_end)}
                      </p>
                      {viewMode === 'week' && (
                        <p className="text-xs text-neutral-400">{formatDate(orCase.scheduled_start)}</p>
                      )}
                    </td>
                    <td className={table.cell}>
                      {room ? (
                        <>
                          <p className="font-medium text-neutral-800">{room.room_number}</p>
                          <p className="text-xs text-neutral-500">{formatLabel(room.room_type)}</p>
                        </>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className={table.cell}>
                      <p className="font-medium text-neutral-900">{patient?.full_name ?? '—'}</p>
                      <p className="text-xs text-neutral-500">{patient?.mrn ?? ''}</p>
                    </td>
                    <td className={table.cell}>
                      <p className="font-medium text-neutral-800">{orCase.procedure_name}</p>
                      {orCase.procedure_code && (
                        <p className="text-xs text-neutral-500">{orCase.procedure_code}</p>
                      )}
                    </td>
                    <td className={table.cell}>
                      <span className="text-neutral-700">{surgeon?.full_name ?? '—'}</span>
                    </td>
                    <td className={table.cell}>
                      <span className="text-neutral-600">{formatLabel(orCase.anesthesia_type)}</span>
                    </td>
                    <td className={table.cell}>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[caseStatus]}`}
                      >
                        {formatLabel(caseStatus)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {cases && cases.length > 0 && (
        <p className="mt-3 text-sm text-neutral-500">
          {cases.length} case{cases.length !== 1 ? 's' : ''} found
        </p>
      )}
    </div>
  )
}
