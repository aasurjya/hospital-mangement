import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { table } from '@/lib/styles'
import Link from 'next/link'

export const metadata = { title: 'My Medical Records' }

export default async function PatientRecordsPage() {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const { data: records } = await supabase
    .from('medical_records')
    .select('id, visit_date, chief_complaint, status, user_profiles!medical_records_author_id_fkey(full_name)')
    .eq('patient_id', ctx.patientId)
    .eq('hospital_id', hospitalId)
    .eq('status', 'FINALIZED')
    .order('visit_date', { ascending: false })

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">
        My Medical Records <span className="text-sm font-normal text-neutral-600">({records?.length ?? 0})</span>
      </h1>

      {!records || records.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">No medical records available.</p>
        </div>
      ) : (
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="Medical records">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Date</th>
                <th className={table.headerCell}>Doctor</th>
                <th className={`${table.headerCell} hidden sm:table-cell`}>Chief Complaint</th>
                <th className={table.headerCell}><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {records.map((rec) => {
                const author = rec.user_profiles as { full_name: string } | null
                return (
                  <tr key={rec.id} className={table.row}>
                    <td className={`${table.cell} font-medium text-neutral-900`}>
                      {new Date(rec.visit_date).toLocaleDateString()}
                    </td>
                    <td className={`${table.cell} text-neutral-700`}>{author?.full_name ?? '\u2014'}</td>
                    <td className={`${table.cell} text-neutral-600 hidden sm:table-cell`}>
                      {rec.chief_complaint ? (rec.chief_complaint.length > 60 ? rec.chief_complaint.slice(0, 60) + '\u2026' : rec.chief_complaint) : '\u2014'}
                    </td>
                    <td className={table.cell}>
                      <Link href={`/patient/records/${rec.id}`} className="text-sm text-primary-600 hover:text-primary-800 min-h-[44px] inline-flex items-center">
                        View
                      </Link>
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
