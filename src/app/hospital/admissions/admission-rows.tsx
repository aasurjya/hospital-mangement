'use client'

import { useTransition } from 'react'
import { dischargePatientAction } from './actions'
import { formatLabel } from '@/lib/format'
import { statusBadge, table } from '@/lib/styles'
import type { AdmissionStatus } from '@/types/database'
import type { AdmissionRow } from './page'

export function AdmissionRows({ admissions }: { admissions: AdmissionRow[] }) {
  return (
    <div className={table.wrapper}>
      <table className="min-w-full divide-y divide-neutral-200" aria-label="Admissions">
        <thead className={table.header}>
          <tr>
            <th className={table.headerCell}>Patient</th>
            <th className={`${table.headerCell} hidden sm:table-cell`}>Doctor</th>
            <th className={`${table.headerCell} hidden md:table-cell`}>Dept</th>
            <th className={`${table.headerCell} hidden md:table-cell`}>Bed</th>
            <th className={`${table.headerCell} hidden lg:table-cell`}>Reason</th>
            <th className={table.headerCell}>Admitted</th>
            <th className={table.headerCell}>Status</th>
            <th className={table.headerCell}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className={table.body}>
          {admissions.map((a) => <AdmissionRowItem key={a.id} admission={a} />)}
        </tbody>
      </table>
    </div>
  )
}

function AdmissionRowItem({ admission: a }: { admission: AdmissionRow }) {
  const [isPending, startTransition] = useTransition()
  const badgeCls = statusBadge[a.status as AdmissionStatus] ?? statusBadge.inactive

  return (
    <tr className={table.row}>
      <td className={`${table.cell} font-medium`}>
        {a.patients ? (
          <>
            <a href={`/hospital/patients/${a.patients.id}`}
              className="text-primary-600 hover:text-primary-800">
              {a.patients.full_name}
            </a>
            <div className="mt-0.5 font-mono text-xs text-neutral-500">{a.patients.mrn}</div>
            {/* Mobile: show doctor inline */}
            <div className="mt-0.5 text-xs text-neutral-500 sm:hidden">{a.user_profiles?.full_name}</div>
          </>
        ) : '—'}
      </td>
      <td className={`${table.cell} hidden text-neutral-600 sm:table-cell`}>
        {a.user_profiles?.full_name ?? '—'}
      </td>
      <td className={`${table.cell} hidden text-neutral-600 md:table-cell`}>
        {a.departments?.name ?? '—'}
      </td>
      <td className={`${table.cell} hidden text-neutral-500 md:table-cell font-mono text-xs`}>
        {a.bed_number ?? '—'}
      </td>
      <td className={`${table.cell} hidden max-w-[160px] truncate text-neutral-600 lg:table-cell`}>
        {a.reason ?? '—'}
      </td>
      <td className={`${table.cell} whitespace-nowrap text-neutral-500`}>
        {new Date(a.admitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      </td>
      <td className={table.cell}>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
          {formatLabel(a.status)}
        </span>
      </td>
      <td className={table.cell}>
        {a.status === 'ADMITTED' && (
          <button
            disabled={isPending}
            aria-label={`Discharge ${a.patients?.full_name ?? 'patient'}`}
            onClick={() => {
              if (!confirm(`Discharge ${a.patients?.full_name ?? 'this patient'}? This cannot be undone.`)) return
              startTransition(() => dischargePatientAction(a.id))
            }}
            className="min-h-[44px] px-1 text-xs font-medium text-error-600 hover:text-error-800 disabled:opacity-50"
          >
            {isPending ? 'Discharging…' : 'Discharge'}
          </button>
        )}
      </td>
    </tr>
  )
}
