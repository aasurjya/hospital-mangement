import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canPrescribe } from '@/lib/prescriptions/permissions'
import { formatLabel } from '@/lib/format'
import { btn, table as t, statusBadge } from '@/lib/styles'
import Link from 'next/link'
import { PrescriptionActions } from './prescription-actions'

export const metadata = { title: 'Prescriptions' }

export default async function PrescriptionsPage() {
  const { profile } = await requireAuth()
  const supabase = await createSupabaseServerClient()

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*, patients!inner(full_name, mrn)')
    .eq('hospital_id', profile.hospital_id!)
    .order('created_at', { ascending: false })
    .limit(50)

  const showCreate = canPrescribe(profile.role)

  const statusColors: Record<string, string> = {
    ACTIVE: statusBadge.ADMITTED,
    COMPLETED: statusBadge.COMPLETED,
    CANCELLED: statusBadge.CANCELLED,
    DISCONTINUED: statusBadge.VOID,
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Prescriptions</h1>
        {showCreate && (
          <Link href="/hospital/prescriptions/new" className={btn.primary}>
            + New Prescription
          </Link>
        )}
      </div>

      <div className={t.wrapper}>
        <table className="w-full" aria-label="Prescriptions">
          <thead className={t.header}>
            <tr>
              <th className={t.headerCell}>Patient</th>
              <th className={t.headerCell}>Drug</th>
              <th className={t.headerCell}>Dosage</th>
              <th className={t.headerCell}>Route</th>
              <th className={t.headerCell}>Frequency</th>
              <th className={t.headerCell}>Status</th>
              <th className={t.headerCell}>Date</th>
              <th className={t.headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody className={t.body}>
            {(!prescriptions || prescriptions.length === 0) && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-sm text-neutral-400">No prescriptions found.</td></tr>
            )}
            {prescriptions?.map((rx) => {
              const patient = rx.patients as unknown as { full_name: string; mrn: string }
              return (
                <tr key={rx.id} className={t.row}>
                  <td className={t.cell}>
                    <div className="font-medium text-neutral-900">{patient.full_name}</div>
                    <div className="text-xs font-mono text-neutral-400">{patient.mrn}</div>
                  </td>
                  <td className={t.cell}>
                    <Link href={`/hospital/prescriptions/${rx.id}`} className="text-primary-600 hover:text-primary-800">
                      {rx.drug_name}
                    </Link>
                    {rx.allergy_override && (
                      <span className="ml-1 text-xs text-error-600" title="Allergy override">⚠</span>
                    )}
                  </td>
                  <td className={t.cell}>{rx.dosage}</td>
                  <td className={t.cell}>{formatLabel(rx.route)}</td>
                  <td className={t.cell}>{rx.frequency}</td>
                  <td className={t.cell}>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[rx.status] ?? ''}`}>
                      {formatLabel(rx.status)}
                    </span>
                  </td>
                  <td className={`${t.cell} whitespace-nowrap`}>{new Date(rx.created_at).toLocaleDateString()}</td>
                  <td className={t.cell}>
                    <PrescriptionActions prescriptionId={rx.id} status={rx.status} userRole={profile.role} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
