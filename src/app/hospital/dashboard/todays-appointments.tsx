import { formatLabel } from '@/lib/format'
import { statusBadge, table } from '@/lib/styles'
import type { TodayAppointment } from './queries'
import type { AppointmentStatus } from '@/types/database'

interface Props {
  appointments: TodayAppointment[]
  role: string
}

export function TodaysAppointments({ appointments, role }: Props) {
  const heading = role === 'DOCTOR' ? 'My appointments today' : "Today's appointments"
  const isDoctor = role === 'DOCTOR'

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-neutral-900">{heading}</h2>
        <a href="/hospital/appointments" aria-label="View all appointments"
          className="text-xs font-medium text-primary-600 hover:text-primary-800">
          View all
        </a>
      </div>

      {appointments.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-neutral-500">No appointments today.</p>
          {/* L5: min-h-[44px] touch target */}
          <a
            href="/hospital/appointments/new"
            className="mt-2 inline-flex min-h-[44px] items-center text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            Schedule appointment
          </a>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-100" aria-label={heading}>
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Time</th>
                <th className={table.headerCell}>Patient</th>
                {/* M2: omit Doctor column when viewer is the doctor */}
                {!isDoctor && <th className={table.headerCell}>Doctor</th>}
                <th className={table.headerCell}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {appointments.map((a) => (
                <tr key={a.id} className={table.row}>
                  <td className={`${table.cell} font-medium text-neutral-900 tabular-nums`}>
                    <time dateTime={a.scheduled_at}>
                      {new Date(a.scheduled_at).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </td>
                  <td className={table.cell}>
                    {/* C3: text-primary-600 visible at rest */}
                    <a
                      href={`/hospital/patients/${a.patientId}`}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      {a.patientName}
                    </a>
                  </td>
                  {!isDoctor && (
                    <td className={`${table.cell} text-neutral-600`}>
                      {a.doctorName ?? <span className="text-neutral-500">—</span>}
                    </td>
                  )}
                  <td className={table.cell}>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusBadge[a.status as AppointmentStatus] ?? statusBadge.inactive
                      }`}
                    >
                      {formatLabel(a.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
