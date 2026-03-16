import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canWriteAllergies } from '@/lib/clinical/permissions'
import { formatLabel } from '@/lib/format'
import { AllergyForm } from './allergy-form'

export const metadata = { title: 'Patient Allergies' }

export default async function PatientAllergiesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await requireAuth()
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: patient }, { data: allergies }] = await Promise.all([
    supabase.from('patients').select('id, full_name, mrn').eq('id', id).eq('hospital_id', profile.hospital_id!).single(),
    supabase.from('patient_allergies').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
  ])

  if (!patient) notFound()

  const canWrite = canWriteAllergies(profile.role)

  const severityColor: Record<string, string> = {
    MILD: 'bg-success-100 text-success-700',
    MODERATE: 'bg-caution-100 text-caution-800',
    SEVERE: 'bg-warning-100 text-warning-700',
    LIFE_THREATENING: 'bg-error-100 text-error-700',
  }

  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-error-100 text-error-700',
    INACTIVE: 'bg-neutral-100 text-neutral-600',
    RESOLVED: 'bg-success-100 text-success-700',
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <a href={`/hospital/patients/${id}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← {patient.full_name}
        </a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Allergies</h1>
        <p className="text-sm text-neutral-500">{patient.mrn}</p>
      </div>

      {canWrite && <AllergyForm patientId={id} />}

      {/* Allergy list */}
      <div className="space-y-3">
        {(!allergies || allergies.length === 0) && (
          <p className="text-sm text-neutral-400">No allergies recorded.</p>
        )}
        {allergies?.map((a) => (
          <div key={a.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-neutral-900">{a.allergen_name}</h3>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${severityColor[a.severity] ?? ''}`}>
                    {formatLabel(a.severity)}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[a.status] ?? ''}`}>
                    {formatLabel(a.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {formatLabel(a.allergen_type)}
                  {a.reaction && <> &mdash; {a.reaction}</>}
                </p>
                {a.notes && <p className="mt-1 text-sm text-neutral-400">{a.notes}</p>}
              </div>
              <span className="text-xs text-neutral-400">
                {new Date(a.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
