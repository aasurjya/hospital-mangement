import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { table, statusBadge, card } from '@/lib/styles'

export const metadata = { title: 'My Admissions' }

export default async function PatientAdmissionsPage() {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const { data: admissions } = await supabase
    .from('admissions')
    .select('id, admitted_at, discharged_at, status, reason, notes, bed_number, rooms(room_number, room_type), departments(name), user_profiles!admissions_doctor_id_fkey(full_name)')
    .eq('patient_id', ctx.patientId)
    .eq('hospital_id', hospitalId)
    .order('admitted_at', { ascending: false })

  const current = (admissions ?? []).find((a) => a.status === 'ADMITTED')
  const past = (admissions ?? []).filter((a) => a.status !== 'ADMITTED')

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">My Admissions</h1>

      {/* Current admission */}
      {current && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-neutral-900 mb-3">Current Admission</h2>
          <div className={`${card.base} border-primary-200`}>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-neutral-500">Admitted</dt>
                <dd className="font-medium text-neutral-900">{new Date(current.admitted_at).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Room</dt>
                <dd className="font-medium text-neutral-900">{(current.rooms as { room_number: string } | null)?.room_number ?? 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Department</dt>
                <dd className="font-medium text-neutral-900">{(current.departments as { name: string } | null)?.name ?? 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Doctor</dt>
                <dd className="font-medium text-neutral-900">{(current.user_profiles as { full_name: string } | null)?.full_name ?? 'N/A'}</dd>
              </div>
              {current.reason && (
                <div className="col-span-2">
                  <dt className="text-neutral-500">Reason</dt>
                  <dd className="font-medium text-neutral-900">{current.reason}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* Past admissions */}
      <h2 className="text-base font-semibold text-neutral-900 mb-3">
        Past Admissions {past.length > 0 && <span className="text-sm font-normal text-neutral-600">({past.length})</span>}
      </h2>

      {past.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">{current ? 'No past admissions.' : 'No admissions found.'}</p>
        </div>
      ) : (
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="Past admissions">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Admitted</th>
                <th className={table.headerCell}>Discharged</th>
                <th className={`${table.headerCell} hidden sm:table-cell`}>Department</th>
                <th className={`${table.headerCell} hidden md:table-cell`}>Doctor</th>
                <th className={table.headerCell}>Status</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {past.map((adm) => {
                const badgeKey = adm.status as keyof typeof statusBadge
                return (
                  <tr key={adm.id} className={table.row}>
                    <td className={`${table.cell} font-medium text-neutral-900`}>{new Date(adm.admitted_at).toLocaleDateString()}</td>
                    <td className={`${table.cell} text-neutral-700`}>{adm.discharged_at ? new Date(adm.discharged_at).toLocaleDateString() : '\u2014'}</td>
                    <td className={`${table.cell} text-neutral-600 hidden sm:table-cell`}>{(adm.departments as { name: string } | null)?.name ?? '\u2014'}</td>
                    <td className={`${table.cell} text-neutral-600 hidden md:table-cell`}>{(adm.user_profiles as { full_name: string } | null)?.full_name ?? '\u2014'}</td>
                    <td className={table.cell}>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[badgeKey] ?? ''}`}>
                        {formatLabel(adm.status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
