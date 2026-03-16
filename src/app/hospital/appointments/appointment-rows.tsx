'use client'

import { useTransition } from 'react'
import { updateAppointmentStatusAction } from './actions'
import { formatLabel } from '@/lib/format'
import { statusBadge, table } from '@/lib/styles'
import type { AppointmentStatus } from '@/types/database'
import type { AppointmentRow } from './page'

const NEXT_ACTIONS: Record<string, { label: string; status: AppointmentStatus }[]> = {
  SCHEDULED: [{ label: 'Confirm', status: 'CONFIRMED' }, { label: 'Cancel', status: 'CANCELLED' }],
  CONFIRMED: [{ label: 'Complete', status: 'COMPLETED' }, { label: 'No show', status: 'NO_SHOW' }, { label: 'Cancel', status: 'CANCELLED' }],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

export function AppointmentRows({ appointments }: { appointments: AppointmentRow[] }) {
  return (
    <div className={table.wrapper}>
      <table className="min-w-full divide-y divide-neutral-200" aria-label="Appointments">
        <thead className={table.header}>
          <tr>
            <th className={table.headerCell}>Date / Time</th>
            <th className={table.headerCell}>Patient</th>
            <th className={`${table.headerCell} hidden sm:table-cell`}>Doctor</th>
            <th className={`${table.headerCell} hidden md:table-cell`}>Dept</th>
            <th className={`${table.headerCell} hidden lg:table-cell`}>Reason</th>
            <th className={table.headerCell}>Status</th>
            <th className={table.headerCell}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className={table.body}>
          {appointments.map((a) => <AppointmentRowItem key={a.id} appt={a} />)}
        </tbody>
      </table>
    </div>
  )
}

function AppointmentRowItem({ appt }: { appt: AppointmentRow }) {
  const [isPending, startTransition] = useTransition()
  const actions = NEXT_ACTIONS[appt.status] ?? []
  const badgeCls = statusBadge[appt.status as AppointmentStatus] ?? statusBadge.inactive

  return (
    <tr className={table.row}>
      <td className={`${table.cell} whitespace-nowrap text-neutral-900`}>
        <div className="font-medium">
          {new Date(appt.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
        <div className="text-xs text-neutral-500 tabular-nums">
          {new Date(appt.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </div>
      </td>
      <td className={table.cell}>
        {appt.patients ? (
          <>
            <a href={`/hospital/patients/${appt.patients.id}`}
              className="font-medium text-primary-600 hover:text-primary-800">
              {appt.patients.full_name}
            </a>
            <div className="mt-0.5 font-mono text-xs text-neutral-400">{appt.patients.mrn}</div>
            {/* Mobile: show doctor inline */}
            <div className="mt-0.5 text-xs text-neutral-500 sm:hidden">{appt.user_profiles?.full_name}</div>
          </>
        ) : '—'}
      </td>
      <td className={`${table.cell} hidden text-neutral-600 sm:table-cell`}>
        {appt.user_profiles?.full_name ?? '—'}
      </td>
      <td className={`${table.cell} hidden text-neutral-600 md:table-cell`}>
        {appt.departments?.name ?? '—'}
      </td>
      <td className={`${table.cell} hidden max-w-[160px] truncate text-neutral-600 lg:table-cell`}>
        {appt.reason ?? '—'}
      </td>
      <td className={table.cell}>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
          {formatLabel(appt.status)}
        </span>
      </td>
      <td className={table.cell}>
        <div className="flex gap-3">
          {actions.map(({ label, status }) => (
            <button
              key={status}
              disabled={isPending}
              onClick={() => startTransition(() => updateAppointmentStatusAction(appt.id, status))}
              className="min-h-[44px] px-1 text-xs font-medium text-primary-600 hover:text-primary-800 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      </td>
    </tr>
  )
}
