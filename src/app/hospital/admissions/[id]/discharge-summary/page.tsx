import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { SummaryForm } from './summary-form'
import {
  createDischargeSummaryAction,
  updateDischargeSummaryAction,
  finalizeDischargeSummaryAction,
} from './actions'
import type { DischargeSummaryStatus } from '@/types/database'

export const metadata = { title: 'Discharge Summary' }

const WRITE_ROLES = ['HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'] as const

type Props = {
  params: Promise<{ id: string }>
}

export default async function DischargeSummaryPage({ params }: Props) {
  const { id: admissionId } = await params
  const { profile } = await requireAuth()
  const hospitalId = profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const { data: admission } = await supabase
    .from('admissions')
    .select(`
      id, admitted_at, discharged_at, status, reason,
      patients!inner(id, full_name, mrn),
      user_profiles!admissions_doctor_id_fkey(full_name),
      departments!admissions_department_id_fkey(name)
    `)
    .eq('id', admissionId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!admission) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">Admission not found.</p>
          <a href="/hospital/admissions" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
            Back to admissions
          </a>
        </div>
      </div>
    )
  }

  const patientId = (admission.patients as unknown as { id: string }).id

  // Fetch existing summary
  const { data: rawSummary } = await supabase
    .from('discharge_summaries')
    .select('id, status, admission_diagnosis, discharge_diagnosis, summary_of_stay, procedures, follow_up_instructions, follow_up_date, finalized_by, finalized_at')
    .eq('admission_id', admissionId)
    .single()

  const summary = rawSummary as {
    id: string
    status: DischargeSummaryStatus
    admission_diagnosis: string | null
    discharge_diagnosis: string | null
    summary_of_stay: string | null
    procedures: string | null
    follow_up_instructions: string | null
    follow_up_date: string | null
    finalized_by: string | null
    finalized_at: string | null
  } | null

  // Fetch active diagnoses for this patient
  const { data: rawDiagnoses } = await supabase
    .from('patient_diagnoses')
    .select('id, description, icd10_code, status')
    .eq('patient_id', patientId)
    .eq('hospital_id', hospitalId)
    .in('status', ['ACTIVE', 'CHRONIC'])
    .order('diagnosed_date', { ascending: false })
    .limit(10)

  const diagnoses = (rawDiagnoses ?? []) as {
    id: string
    description: string
    icd10_code: string | null
    status: 'ACTIVE' | 'CHRONIC' | 'RESOLVED' | 'RULED_OUT'
  }[]

  // Fetch active prescriptions linked to this admission
  const { data: rawPrescriptions } = await supabase
    .from('prescriptions')
    .select('id, drug_name, dosage, frequency, route')
    .eq('patient_id', patientId)
    .eq('hospital_id', hospitalId)
    .eq('admission_id', admissionId)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(15)

  const prescriptions = (rawPrescriptions ?? []) as {
    id: string
    drug_name: string
    dosage: string
    frequency: string
    route: string
  }[]

  // Fetch latest vitals for this admission
  const { data: rawVitals } = await supabase
    .from('vital_signs')
    .select('systolic_bp, diastolic_bp, heart_rate, temperature, o2_saturation, weight_kg, recorded_at')
    .eq('patient_id', patientId)
    .eq('hospital_id', hospitalId)
    .eq('admission_id', admissionId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  const latestVitals = rawVitals as {
    systolic_bp: number | null
    diastolic_bp: number | null
    heart_rate: number | null
    temperature: number | null
    o2_saturation: number | null
    weight_kg: number | null
    recorded_at: string
  } | null

  const canWrite = (WRITE_ROLES as readonly string[]).includes(profile.role)

  const patient = admission.patients as unknown as { id: string; full_name: string; mrn: string }
  const doctor = admission.user_profiles as unknown as { full_name: string } | null
  const department = admission.departments as unknown as { name: string } | null

  // Bind admission-specific server actions
  const boundCreate = createDischargeSummaryAction.bind(null, admissionId)
  const boundUpdate = summary
    ? updateDischargeSummaryAction.bind(null, summary.id, admissionId)
    : null
  // bind(null, summaryId, admissionId) — leaves (prev, formData) as positional args
  const boundFinalize = summary
    ? finalizeDischargeSummaryAction.bind(null, summary.id, admissionId)
    : null

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <a
          href={`/hospital/admissions`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← Back to admissions
        </a>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Discharge Summary</h1>
            <p className="mt-1 text-sm text-neutral-600">
              <a
                href={`/hospital/patients/${patient.id}`}
                className="font-medium text-primary-600 hover:text-primary-800"
              >
                {patient.full_name}
              </a>
              {' · '}
              <span className="font-mono text-xs">{patient.mrn}</span>
            </p>
          </div>
          <dl className="flex gap-6 text-sm sm:text-right">
            <div>
              <dt className="text-xs text-neutral-500">Admitted</dt>
              <dd className="font-medium text-neutral-800">
                {new Date(admission.admitted_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </dd>
            </div>
            {doctor && (
              <div>
                <dt className="text-xs text-neutral-500">Physician</dt>
                <dd className="font-medium text-neutral-800">{doctor.full_name}</dd>
              </div>
            )}
            {department && (
              <div>
                <dt className="text-xs text-neutral-500">Department</dt>
                <dd className="font-medium text-neutral-800">{department.name}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-neutral-500">Status</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    admission.status === 'ADMITTED'
                      ? 'bg-primary-100 text-primary-700'
                      : admission.status === 'DISCHARGED'
                      ? 'bg-success-100 text-success-700'
                      : 'bg-caution-100 text-caution-800'
                  }`}
                >
                  {formatLabel(admission.status)}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {!canWrite && !summary && (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">
            No discharge summary has been created for this admission yet.
          </p>
        </div>
      )}

      {canWrite && !summary && (
        <SummaryForm
          admissionId={admissionId}
          summary={null}
          diagnoses={diagnoses}
          prescriptions={prescriptions}
          latestVitals={latestVitals}
          createAction={boundCreate}
          updateAction={async (_prev, _fd) => ({ error: 'No existing summary to update.' })}
          finalizeAction={async (_prev, _fd) => ({ error: 'Save the summary first before finalizing.' })}
        />
      )}

      {summary && canWrite && (
        <SummaryForm
          admissionId={admissionId}
          summary={summary}
          diagnoses={diagnoses}
          prescriptions={prescriptions}
          latestVitals={latestVitals}
          createAction={async (_prev, _fd) => ({ error: 'Summary already exists.' })}
          updateAction={boundUpdate!}
          finalizeAction={boundFinalize!}
        />
      )}

      {summary && !canWrite && (
        <SummaryForm
          admissionId={admissionId}
          summary={{ ...summary, status: 'FINALIZED' }}
          diagnoses={diagnoses}
          prescriptions={prescriptions}
          latestVitals={latestVitals}
          createAction={async (_prev, _fd) => ({ error: 'Not permitted.' })}
          updateAction={async (_prev, _fd) => ({ error: 'Not permitted.' })}
          finalizeAction={async (_prev, _fd) => ({ error: 'Not permitted.' })}
        />
      )}
    </div>
  )
}
