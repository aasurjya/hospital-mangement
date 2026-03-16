import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { canManageSchedule, canViewSchedule } from '@/lib/scheduling/permissions'
import { table, btn, statusBadge } from '@/lib/styles'
import type { ShiftType } from '@/types/database'

export const metadata = { title: 'Staff Scheduling' }

/** Day-of-week labels for a Monday-based week starting at a given date */
function getWeekDays(startDate: Date): { label: string; iso: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    return { label, iso }
  })
}

function getWeekStart(refDate: Date): Date {
  const d = new Date(refDate)
  const day = d.getDay()
  // Adjust to Monday (0=Sun → go back 6, 1=Mon → 0, etc.)
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const SHIFT_BADGE: Record<ShiftType, string> = {
  MORNING: 'bg-caution-100 text-caution-800',
  AFTERNOON: 'bg-primary-100 text-primary-700',
  NIGHT: 'bg-secondary-100 text-secondary-700',
  ON_CALL: 'bg-error-100 text-error-700',
}

export default async function SchedulingPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; department?: string }>
}) {
  const { profile } = await requireAuth()

  if (!canViewSchedule(profile.role)) {
    return (
      <div className="p-6">
        <p className="text-sm text-neutral-600">You do not have access to view schedules.</p>
      </div>
    )
  }

  const { week, department } = await searchParams
  const canManage = canManageSchedule(profile.role)
  const hospitalId = profile.hospital_id!

  // Calculate current week start
  const today = new Date()
  const baseWeekStart = week ? new Date(week) : getWeekStart(today)
  const weekDays = getWeekDays(baseWeekStart)
  const weekEnd = weekDays[6].iso
  const weekStart = weekDays[0].iso

  const prevWeek = new Date(baseWeekStart)
  prevWeek.setDate(prevWeek.getDate() - 7)
  const nextWeek = new Date(baseWeekStart)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const supabase = await createSupabaseServerClient()

  // Fetch departments for filter
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .eq('hospital_id', hospitalId)
    .eq('is_active', true)
    .order('name')

  // Fetch shifts for the week
  let shiftsQuery = supabase
    .from('shift_schedules')
    .select(`
      id,
      staff_id,
      department_id,
      shift_type,
      shift_date,
      start_time,
      end_time,
      notes,
      user_profiles!staff_id (full_name),
      departments!department_id (name)
    `)
    .eq('hospital_id', hospitalId)
    .gte('shift_date', weekStart)
    .lte('shift_date', weekEnd)
    .order('start_time')

  if (department) {
    shiftsQuery = shiftsQuery.eq('department_id', department)
  }

  const { data: shifts } = await shiftsQuery

  // Group shifts by date for calendar view
  type ShiftRow = NonNullable<typeof shifts>[number]
  const shiftsByDate = (shifts ?? []).reduce<Record<string, ShiftRow[]>>((acc, shift) => {
    const existing = acc[shift.shift_date] ?? []
    return { ...acc, [shift.shift_date]: [...existing, shift] }
  }, {})

  // Fetch pending swap requests if manager
  const { data: pendingSwaps } = canManage
    ? await supabase
        .from('shift_swap_requests')
        .select(`
          id,
          reason,
          created_at,
          shift_schedules!requester_shift_id (
            shift_type,
            shift_date,
            start_time,
            user_profiles!staff_id (full_name)
          ),
          user_profiles!target_staff_id (full_name)
        `)
        .eq('hospital_id', hospitalId)
        .eq('status', 'PENDING')
        .order('created_at')
    : { data: [] }

  const buildWeekHref = (weekDate: Date) =>
    `?week=${weekDate.toISOString().slice(0, 10)}${department ? `&department=${department}` : ''}`

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Staff Scheduling</h1>
        {canManage && (
          <a href="/hospital/scheduling/new" className={btn.primary}>
            Add Shift
          </a>
        )}
      </div>

      {/* Week navigation */}
      <div className="mb-4 flex items-center gap-4">
        <a
          href={buildWeekHref(prevWeek)}
          className={btn.secondary}
          aria-label="Previous week"
        >
          ← Prev
        </a>
        <span className="text-sm font-medium text-neutral-700">
          {weekDays[0].label} – {weekDays[6].label}
        </span>
        <a
          href={buildWeekHref(nextWeek)}
          className={btn.secondary}
          aria-label="Next week"
        >
          Next →
        </a>
      </div>

      {/* Department filter */}
      {departments && departments.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2" role="navigation" aria-label="Filter by department">
          <a
            href={`?week=${weekStart}`}
            aria-current={!department ? 'true' : undefined}
            className={`inline-flex items-center min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors ${
              !department ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All Departments
          </a>
          {departments.map((dept) => (
            <a
              key={dept.id}
              href={`?week=${weekStart}&department=${dept.id}`}
              aria-current={department === dept.id ? 'true' : undefined}
              className={`inline-flex items-center min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors ${
                department === dept.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {dept.name}
            </a>
          ))}
        </div>
      )}

      {/* Weekly calendar grid */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="min-w-full" aria-label="Weekly shift schedule">
          <thead className={table.header}>
            <tr>
              {weekDays.map(({ label, iso }) => (
                <th
                  key={iso}
                  scope="col"
                  className={`${table.headerCell} ${iso === today.toISOString().slice(0, 10) ? 'bg-primary-50' : ''}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {weekDays.map(({ iso }) => {
                const dayShifts = shiftsByDate[iso] ?? []
                const isToday = iso === today.toISOString().slice(0, 10)
                return (
                  <td
                    key={iso}
                    className={`align-top px-2 py-3 text-sm min-w-[160px] border-r border-neutral-100 last:border-r-0 ${
                      isToday ? 'bg-primary-50/30' : ''
                    }`}
                  >
                    {dayShifts.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">No shifts</p>
                    ) : (
                      <ul className="space-y-2">
                        {dayShifts.map((shift) => {
                          const staffName =
                            (shift.user_profiles as unknown as { full_name: string } | null)?.full_name ?? 'Unknown'
                          const deptName =
                            (shift.departments as unknown as { name: string } | null)?.name ?? null
                          return (
                            <li
                              key={shift.id}
                              className="rounded-md border border-neutral-200 bg-white p-2 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SHIFT_BADGE[shift.shift_type as ShiftType]}`}
                                >
                                  {formatLabel(shift.shift_type)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-medium text-neutral-800 truncate">{staffName}</p>
                              <p className="text-xs text-neutral-500">
                                {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                              </p>
                              {deptName && (
                                <p className="text-xs text-neutral-400 truncate">{deptName}</p>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pending swap requests */}
      {canManage && pendingSwaps && pendingSwaps.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            Pending Swap Requests{' '}
            <span className="text-sm font-normal text-neutral-500">({pendingSwaps.length})</span>
          </h2>
          <div className={table.wrapper}>
            <table className="min-w-full" aria-label="Pending swap requests">
              <thead className={table.header}>
                <tr>
                  {['Requester', 'Shift', 'Wants to Swap With', 'Reason', 'Requested'].map((h) => (
                    <th key={h} scope="col" className={table.headerCell}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={table.body}>
                {pendingSwaps.map((swap) => {
                  const shiftInfo = swap.shift_schedules as unknown as {
                    shift_type: string
                    shift_date: string
                    start_time: string
                    user_profiles: { full_name: string } | null
                  } | null
                  const targetStaff = swap.user_profiles as unknown as { full_name: string } | null

                  return (
                    <tr key={swap.id} className={table.row}>
                      <td className={table.cell}>
                        {shiftInfo?.user_profiles?.full_name ?? '—'}
                      </td>
                      <td className={table.cell}>
                        {shiftInfo ? (
                          <>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SHIFT_BADGE[shiftInfo.shift_type as ShiftType] ?? ''}`}
                            >
                              {formatLabel(shiftInfo.shift_type)}
                            </span>
                            <span className="ml-2 text-xs text-neutral-500">
                              {shiftInfo.shift_date} {shiftInfo.start_time.slice(0, 5)}
                            </span>
                          </>
                        ) : '—'}
                      </td>
                      <td className={table.cell}>{targetStaff?.full_name ?? '—'}</td>
                      <td className={table.cell}>
                        <span className="text-neutral-600">{swap.reason ?? '—'}</span>
                      </td>
                      <td className={table.cell}>
                        <span className="text-neutral-500 text-xs">
                          {new Date(swap.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Use the API or a dedicated review page to approve or reject swap requests.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-3">
        {(['MORNING', 'AFTERNOON', 'NIGHT', 'ON_CALL'] as ShiftType[]).map((t) => (
          <span key={t} className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${SHIFT_BADGE[t]}`}>
            {formatLabel(t)}
          </span>
        ))}
      </div>
    </div>
  )
}
