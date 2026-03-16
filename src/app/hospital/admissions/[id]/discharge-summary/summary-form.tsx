'use client'

import { useActionState } from 'react'
import { btn, input, alert, card } from '@/lib/styles'
import type { DischargeSummaryActionState } from './actions'
import type { DischargeSummaryStatus, DiagnosisStatus } from '@/types/database'

type Diagnosis = {
  id: string
  description: string
  icd10_code: string | null
  status: DiagnosisStatus
}

type Prescription = {
  id: string
  drug_name: string
  dosage: string
  frequency: string
  route: string
}

type VitalSigns = {
  systolic_bp: number | null
  diastolic_bp: number | null
  heart_rate: number | null
  temperature: number | null
  o2_saturation: number | null
  weight_kg: number | null
  recorded_at: string
} | null

type ExistingSummary = {
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
}

type SummaryFormProps = {
  admissionId: string
  summary: ExistingSummary | null
  diagnoses: Diagnosis[]
  prescriptions: Prescription[]
  latestVitals: VitalSigns
  createAction: (
    prev: DischargeSummaryActionState,
    formData: FormData
  ) => Promise<DischargeSummaryActionState>
  updateAction: (
    prev: DischargeSummaryActionState,
    formData: FormData
  ) => Promise<DischargeSummaryActionState>
  /** Accepts (prev, formData) signature so it can be used with useActionState */
  finalizeAction: (
    prev: DischargeSummaryActionState,
    formData: FormData
  ) => Promise<DischargeSummaryActionState>
}

function ReferencePanel({
  diagnoses,
  prescriptions,
  latestVitals,
}: {
  diagnoses: Diagnosis[]
  prescriptions: Prescription[]
  latestVitals: VitalSigns
}) {
  return (
    <aside className={`${card.base} space-y-5`}>
      <h3 className="text-sm font-semibold text-neutral-700">Reference Data</h3>

      {diagnoses.length > 0 && (
        <section>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Active Diagnoses
          </h4>
          <ul className="space-y-1">
            {diagnoses.map((d) => (
              <li key={d.id} className="text-sm text-neutral-700">
                {d.icd10_code && (
                  <span className="mr-1.5 font-mono text-xs text-neutral-500">{d.icd10_code}</span>
                )}
                {d.description}
              </li>
            ))}
          </ul>
        </section>
      )}

      {prescriptions.length > 0 && (
        <section>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Active Medications
          </h4>
          <ul className="space-y-1">
            {prescriptions.map((p) => (
              <li key={p.id} className="text-sm text-neutral-700">
                <span className="font-medium">{p.drug_name}</span>
                {' — '}
                <span className="text-neutral-600">
                  {p.dosage} {p.route}, {p.frequency}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {latestVitals && (
        <section>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Latest Vitals
          </h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {latestVitals.systolic_bp != null && latestVitals.diastolic_bp != null && (
              <>
                <dt className="text-neutral-500">BP</dt>
                <dd className="text-neutral-700">
                  {latestVitals.systolic_bp}/{latestVitals.diastolic_bp} mmHg
                </dd>
              </>
            )}
            {latestVitals.heart_rate != null && (
              <>
                <dt className="text-neutral-500">HR</dt>
                <dd className="text-neutral-700">{latestVitals.heart_rate} bpm</dd>
              </>
            )}
            {latestVitals.temperature != null && (
              <>
                <dt className="text-neutral-500">Temp</dt>
                <dd className="text-neutral-700">{latestVitals.temperature} °C</dd>
              </>
            )}
            {latestVitals.o2_saturation != null && (
              <>
                <dt className="text-neutral-500">SpO2</dt>
                <dd className="text-neutral-700">{latestVitals.o2_saturation}%</dd>
              </>
            )}
            {latestVitals.weight_kg != null && (
              <>
                <dt className="text-neutral-500">Weight</dt>
                <dd className="text-neutral-700">{latestVitals.weight_kg} kg</dd>
              </>
            )}
          </dl>
          <p className="mt-1 text-xs text-neutral-400">
            Recorded{' '}
            {new Date(latestVitals.recorded_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </section>
      )}

      {diagnoses.length === 0 && prescriptions.length === 0 && !latestVitals && (
        <p className="text-sm text-neutral-500">No clinical data recorded for this admission.</p>
      )}
    </aside>
  )
}

function ReadOnlyView({ summary }: { summary: ExistingSummary }) {
  const Field = ({ label, value }: { label: string; value: string | null }) =>
    value ? (
      <div>
        <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</dt>
        <dd className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">{value}</dd>
      </div>
    ) : null

  return (
    <div className={`${card.base} space-y-4`}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-neutral-800">Discharge Summary</h2>
        <span className="inline-flex rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
          Finalized
        </span>
      </div>

      {summary.finalized_at && (
        <p className="text-xs text-neutral-500">
          Finalized on{' '}
          {new Date(summary.finalized_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}

      <dl className="space-y-4">
        <Field label="Admission Diagnosis" value={summary.admission_diagnosis} />
        <Field label="Discharge Diagnosis" value={summary.discharge_diagnosis} />
        <Field label="Summary of Stay" value={summary.summary_of_stay} />
        <Field label="Procedures Performed" value={summary.procedures} />
        <Field label="Follow-up Instructions" value={summary.follow_up_instructions} />
        {summary.follow_up_date && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Follow-up Date
            </dt>
            <dd className="mt-1 text-sm text-neutral-800">
              {new Date(summary.follow_up_date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}

export function SummaryForm({
  admissionId,
  summary,
  diagnoses,
  prescriptions,
  latestVitals,
  createAction,
  updateAction,
  finalizeAction,
}: SummaryFormProps) {
  const isFinalized = summary?.status === 'FINALIZED'

  const [createState, createDispatch, isCreating] = useActionState(createAction, null)
  const [updateState, updateDispatch, isUpdating] = useActionState(updateAction, null)
  const [finalizeState, finalizeDispatch, isFinalizing] = useActionState(finalizeAction, null)

  if (isFinalized && summary) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ReadOnlyView summary={summary} />
        </div>
        <ReferencePanel
          diagnoses={diagnoses}
          prescriptions={prescriptions}
          latestVitals={latestVitals}
        />
      </div>
    )
  }

  const state = summary ? updateState : createState
  const dispatch = summary ? updateDispatch : createDispatch
  const isPending = summary ? isUpdating : isCreating

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <form action={dispatch} className={`${card.base} space-y-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-800">
              {summary ? 'Edit Discharge Summary' : 'Create Discharge Summary'}
            </h2>
            <span className="inline-flex rounded-full bg-caution-100 px-2 py-0.5 text-xs font-medium text-caution-800">
              Draft
            </span>
          </div>

          {state?.error && (
            <div className={alert.error} role="alert">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="admission_diagnosis" className={input.label}>
              Admission Diagnosis
            </label>
            <textarea
              id="admission_diagnosis"
              name="admission_diagnosis"
              rows={3}
              defaultValue={summary?.admission_diagnosis ?? ''}
              placeholder="Primary reason for admission…"
              className={`${input.base} resize-y`}
            />
            {state?.fieldErrors?.admission_diagnosis && (
              <p className={input.error}>{state.fieldErrors.admission_diagnosis[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="discharge_diagnosis" className={input.label}>
              Discharge Diagnosis
            </label>
            <textarea
              id="discharge_diagnosis"
              name="discharge_diagnosis"
              rows={3}
              defaultValue={summary?.discharge_diagnosis ?? ''}
              placeholder="Final diagnosis at discharge…"
              className={`${input.base} resize-y`}
            />
            {state?.fieldErrors?.discharge_diagnosis && (
              <p className={input.error}>{state.fieldErrors.discharge_diagnosis[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="summary_of_stay" className={input.label}>
              Summary of Stay
            </label>
            <textarea
              id="summary_of_stay"
              name="summary_of_stay"
              rows={6}
              defaultValue={summary?.summary_of_stay ?? ''}
              placeholder="Brief narrative of the patient's hospital stay, treatment course, and response…"
              className={`${input.base} resize-y`}
            />
            {state?.fieldErrors?.summary_of_stay && (
              <p className={input.error}>{state.fieldErrors.summary_of_stay[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="procedures" className={input.label}>
              Procedures Performed
            </label>
            <textarea
              id="procedures"
              name="procedures"
              rows={3}
              defaultValue={summary?.procedures ?? ''}
              placeholder="List procedures performed during admission…"
              className={`${input.base} resize-y`}
            />
            {state?.fieldErrors?.procedures && (
              <p className={input.error}>{state.fieldErrors.procedures[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="follow_up_instructions" className={input.label}>
              Follow-up Instructions
            </label>
            <textarea
              id="follow_up_instructions"
              name="follow_up_instructions"
              rows={4}
              defaultValue={summary?.follow_up_instructions ?? ''}
              placeholder="Discharge medications, wound care, activity restrictions, warning signs to watch for…"
              className={`${input.base} resize-y`}
            />
            {state?.fieldErrors?.follow_up_instructions && (
              <p className={input.error}>{state.fieldErrors.follow_up_instructions[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="follow_up_date" className={input.label}>
              Follow-up Date
            </label>
            <input
              id="follow_up_date"
              name="follow_up_date"
              type="date"
              defaultValue={summary?.follow_up_date ?? ''}
              className={input.base}
            />
            {state?.fieldErrors?.follow_up_date && (
              <p className={input.error}>{state.fieldErrors.follow_up_date[0]}</p>
            )}
          </div>

          <div className="flex justify-start pt-2">
            <button type="submit" disabled={isPending} className={btn.secondary}>
              {isPending ? 'Saving…' : 'Save Draft'}
            </button>
          </div>
        </form>

        {summary && (
          <div className="mt-4">
            {finalizeState?.error && (
              <div className={`${alert.error} mb-3`} role="alert">
                {finalizeState.error}
              </div>
            )}
            <form action={finalizeDispatch}>
              <button
                type="submit"
                disabled={isFinalizing}
                className={btn.success}
                onClick={(e) => {
                  if (!window.confirm('Finalizing a discharge summary is permanent and cannot be undone. Continue?')) {
                    e.preventDefault()
                  }
                }}
              >
                {isFinalizing ? 'Finalizing…' : 'Finalize Summary'}
              </button>
            </form>
          </div>
        )}
      </div>

      <ReferencePanel
        diagnoses={diagnoses}
        prescriptions={prescriptions}
        latestVitals={latestVitals}
      />
    </div>
  )
}
