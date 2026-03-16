import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canWriteDiagnoses } from '@/lib/clinical/permissions'
import { formatLabel } from '@/lib/format'
import { DiagnosisForm } from './diagnosis-form'

export const metadata = { title: 'Patient Diagnoses' }

export default async function PatientDiagnosesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await requireAuth()
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: patient }, { data: diagnoses }] = await Promise.all([
    supabase.from('patients').select('id, full_name, mrn').eq('id', id).eq('hospital_id', profile.hospital_id!).single(),
    supabase.from('patient_diagnoses').select('*').eq('patient_id', id).order('diagnosed_date', { ascending: false }),
  ])

  if (!patient) notFound()

  const canWrite = canWriteDiagnoses(profile.role)

  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-error-100 text-error-700',
    RESOLVED: 'bg-success-100 text-success-700',
    CHRONIC: 'bg-caution-100 text-caution-800',
    RULED_OUT: 'bg-neutral-100 text-neutral-600',
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <a href={`/hospital/patients/${id}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← {patient.full_name}
        </a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Diagnoses</h1>
        <p className="text-sm text-neutral-500">{patient.mrn}</p>
      </div>

      {canWrite && <DiagnosisForm patientId={id} />}

      <div className="space-y-3">
        {(!diagnoses || diagnoses.length === 0) && (
          <p className="text-sm text-neutral-400">No diagnoses recorded.</p>
        )}
        {diagnoses?.map((d) => (
          <div key={d.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-neutral-900">{d.description}</h3>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[d.status] ?? ''}`}>
                    {formatLabel(d.status)}
                  </span>
                </div>
                {d.icd10_code && (
                  <p className="mt-1 text-sm font-mono text-neutral-500">ICD-10: {d.icd10_code}</p>
                )}
                {d.notes && <p className="mt-1 text-sm text-neutral-400">{d.notes}</p>}
              </div>
              <span className="text-xs text-neutral-400">
                {new Date(d.diagnosed_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
