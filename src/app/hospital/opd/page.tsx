import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { table, btn } from '@/lib/styles'
import type { TriageLevel, OpdStatus } from '@/types/database'

export const metadata = { title: 'OPD Queue' }

const TRIAGE_BADGE: Record<TriageLevel, string> = {
  EMERGENCY: 'bg-error-100 text-error-700 border border-error-300',
  URGENT: 'bg-warning-100 text-warning-700 border border-warning-300',
  SEMI_URGENT: 'bg-caution-100 text-caution-800 border border-caution-300',
  NON_URGENT: 'bg-success-100 text-success-700 border border-success-300',
}

const TRIAGE_ROW_HIGHLIGHT: Record<TriageLevel, string> = {
  EMERGENCY: 'bg-error-50',
  URGENT: 'bg-warning-50',
  SEMI_URGENT: 'bg-caution-50',
  NON_URGENT: '',
}

const STATUS_BADGE: Record<OpdStatus, string> = {
  WAITING: 'bg-primary-100 text-primary-700',
  IN_CONSULTATION: 'bg-secondary-100 text-secondary-700',
  COMPLETED: 'bg-success-100 text-success-700',
}

function formatWaitTime(checkedInAt: string): string {
  const diffMs = Date.now() - new Date(checkedInAt).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`
}

export default async function OpdQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; department?: string }>
}) {
  const { profile } = await requireAuth()
  const { status, department } = await searchParams
  const hospitalId = profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  // Only show active queue by default (WAITING + IN_CONSULTATION)
  const showCompleted = status === 'completed'

  // Fetch departments for filter
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .eq('hospital_id', hospitalId)
    .eq('is_active', true)
    .order('name')

  // Build queue query
  let queueQuery = supabase
    .from('opd_queue')
    .select(`
      id,
      patient_id,
      token_number,
      triage_level,
      status,
      chief_complaint,
      checked_in_at,
      consultation_started_at,
      completed_at,
      department_id,
      doctor_id,
      patients!patient_id (full_name, mrn),
      departments!department_id (name),
      user_profiles!doctor_id (full_name)
    `)
    .eq('hospital_id', hospitalId)
    .order('token_number', { ascending: true })

  if (!showCompleted) {
    queueQuery = queueQuery.in('status', ['WAITING', 'IN_CONSULTATION'])
  }

  // Date filter: show today's entries by default
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  queueQuery = queueQuery.gte('checked_in_at', todayStart.toISOString())

  if (department) {
    queueQuery = queueQuery.eq('department_id', department)
  }

  const { data: entries } = await queueQuery

  const waitingCount = (entries ?? []).filter((e) => e.status === 'WAITING').length
  const inConsultationCount = (entries ?? []).filter((e) => e.status === 'IN_CONSULTATION').length

  const canCheckIn =
    profile.role === 'RECEPTIONIST' || profile.role === 'NURSE' || profile.role === 'HOSPITAL_ADMIN'

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">OPD Queue</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Live outpatient department queue — today&apos;s entries
          </p>
        </div>
        {canCheckIn && (
          <a href="/hospital/opd/check-in" className={btn.primary}>
            Check In Patient
          </a>
        )}
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-primary-700">{waitingCount}</p>
          <p className="mt-1 text-xs text-neutral-500">Waiting</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-secondary-700">{inConsultationCount}</p>
          <p className="mt-1 text-xs text-neutral-500">In Consultation</p>
        </div>
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-center">
          <p className="text-2xl font-bold text-error-700">
            {(entries ?? []).filter((e) => e.triage_level === 'EMERGENCY' && e.status !== 'COMPLETED').length}
          </p>
          <p className="mt-1 text-xs text-error-600">Emergency</p>
        </div>
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-4 text-center">
          <p className="text-2xl font-bold text-warning-700">
            {(entries ?? []).filter((e) => e.triage_level === 'URGENT' && e.status !== 'COMPLETED').length}
          </p>
          <p className="mt-1 text-xs text-warning-600">Urgent</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <a
          href={`?${department ? `department=${department}` : ''}`}
          aria-current={!showCompleted ? 'true' : undefined}
          className={`inline-flex items-center min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors ${
            !showCompleted ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          Active Queue
        </a>
        <a
          href={`?status=completed${department ? `&department=${department}` : ''}`}
          aria-current={showCompleted ? 'true' : undefined}
          className={`inline-flex items-center min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors ${
            showCompleted ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          Completed Today
        </a>
        {departments && departments.length > 0 && (
          <>
            <span className="self-center text-neutral-300">|</span>
            {departments.map((dept) => (
              <a
                key={dept.id}
                href={`?${showCompleted ? 'status=completed&' : ''}department=${dept.id}`}
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
          </>
        )}
      </div>

      {/* Queue table */}
      {(!entries || entries.length === 0) ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
          <p className="text-neutral-500">
            {showCompleted ? 'No completed entries today.' : 'Queue is empty.'}
          </p>
        </div>
      ) : (
        <div className={table.wrapper}>
          <table className="min-w-full" aria-label="OPD queue">
            <thead className={table.header}>
              <tr>
                {['Token', 'Patient', 'Triage', 'Status', 'Chief Complaint', 'Wait Time', 'Doctor', 'Department'].map(
                  (h) => (
                    <th key={h} scope="col" className={table.headerCell}>{h}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody className={table.body}>
              {entries.map((entry) => {
                const patient = entry.patients as unknown as { full_name: string; mrn: string } | null
                const dept = entry.departments as unknown as { name: string } | null
                const doctor = entry.user_profiles as unknown as { full_name: string } | null
                const triage = entry.triage_level as TriageLevel
                const entryStatus = entry.status as OpdStatus
                const rowBg = entryStatus !== 'COMPLETED' ? TRIAGE_ROW_HIGHLIGHT[triage] : ''

                return (
                  <tr key={entry.id} className={`${table.row} ${rowBg}`}>
                    <td className={table.cell}>
                      <span className="text-lg font-bold text-neutral-800">#{entry.token_number}</span>
                    </td>
                    <td className={table.cell}>
                      <p className="font-medium text-neutral-900">{patient?.full_name ?? '—'}</p>
                      <p className="text-xs text-neutral-500">{patient?.mrn ?? ''}</p>
                    </td>
                    <td className={table.cell}>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TRIAGE_BADGE[triage]}`}
                      >
                        {formatLabel(triage)}
                      </span>
                    </td>
                    <td className={table.cell}>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[entryStatus]}`}
                      >
                        {formatLabel(entryStatus)}
                      </span>
                    </td>
                    <td className={table.cell}>
                      <span className="text-neutral-700">{entry.chief_complaint ?? '—'}</span>
                    </td>
                    <td className={table.cell}>
                      {entryStatus === 'COMPLETED' ? (
                        <span className="text-xs text-neutral-400">Done</span>
                      ) : (
                        <span className="font-medium text-neutral-700">
                          {formatWaitTime(entry.checked_in_at)}
                        </span>
                      )}
                    </td>
                    <td className={table.cell}>
                      <span className="text-neutral-600">{doctor?.full_name ?? '—'}</span>
                    </td>
                    <td className={table.cell}>
                      <span className="text-neutral-600">{dept?.name ?? '—'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Triage legend */}
      <div className="mt-6 flex flex-wrap gap-3">
        {(['EMERGENCY', 'URGENT', 'SEMI_URGENT', 'NON_URGENT'] as TriageLevel[]).map((level) => (
          <span
            key={level}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${TRIAGE_BADGE[level]}`}
          >
            {formatLabel(level)}
          </span>
        ))}
      </div>
    </div>
  )
}
