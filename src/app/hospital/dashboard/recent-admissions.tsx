import { table } from '@/lib/styles'
import type { RecentAdmission } from './queries'

interface Props {
  admissions: RecentAdmission[]
  role: string
}

// M1: show year only when it differs from the current year
function formatAdmittedDate(iso: string): string {
  const date = new Date(iso)
  const needsYear = date.getFullYear() !== new Date().getFullYear()
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(needsYear && { year: 'numeric' }),
  })
}

export function RecentAdmissions({ admissions, role }: Props) {
  // H6: "Recently admitted" — the query returns last 5, not all
  const heading = role === 'DOCTOR' ? 'My recently admitted patients' : 'Recently admitted'
  const isDoctor = role === 'DOCTOR'

  return (
    <div className="rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-neutral-900">{heading}</h2>
        <a href="/hospital/admissions" aria-label="View all admissions"
          className="text-xs font-medium text-primary-600 hover:text-primary-800">
          View all
        </a>
      </div>

      {admissions.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-neutral-500">No current admissions.</p>
          {/* L5: min-h-[44px] touch target on empty-state CTA */}
          <a
            href="/hospital/admissions/new"
            className="mt-2 inline-flex min-h-[44px] items-center text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            Admit a patient
          </a>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-100" aria-label={heading}>
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Patient</th>
                <th className={table.headerCell}>Room</th>
                {/* M3: omit Doctor column when viewer is the doctor */}
                {!isDoctor && <th className={table.headerCell}>Doctor</th>}
                <th className={table.headerCell}>Admitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {admissions.map((a) => (
                <tr key={a.id} className={table.row}>
                  <td className={`${table.cell} font-medium`}>
                    {/* C3: text-primary-600 makes link visible at rest */}
                    <a
                      href={`/hospital/patients/${a.patientId}`}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      {a.patientName}
                    </a>
                  </td>
                  <td className={`${table.cell} text-neutral-600`}>
                    {a.roomNumber ?? <span className="text-neutral-500">—</span>}
                  </td>
                  {!isDoctor && (
                    <td className={`${table.cell} text-neutral-600`}>
                      {a.doctorName ?? <span className="text-neutral-500">—</span>}
                    </td>
                  )}
                  <td className={`${table.cell} text-neutral-500`}>
                    <time dateTime={a.admitted_at}>{formatAdmittedDate(a.admitted_at)}</time>
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
