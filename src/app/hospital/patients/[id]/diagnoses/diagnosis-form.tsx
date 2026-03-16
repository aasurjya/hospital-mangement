'use client'

import { useActionState, useState } from 'react'
import { createDiagnosisAction, type DiagnosisActionState } from './actions'
import { DIAGNOSIS_STATUSES } from '@/lib/clinical/schemas'
import { btn, input, alert } from '@/lib/styles'
import { formatLabel } from '@/lib/format'

export function DiagnosisForm({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<DiagnosisActionState, FormData>(createDiagnosisAction, null)

  if (state?.success) {
    setOpen(false)
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btn.primary}>
        + Record Diagnosis
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="mb-4 text-base font-medium text-neutral-900">Record Diagnosis</h2>
      {state?.error && <div className={`${alert.error} mb-4`} role="status" aria-live="polite">{state.error}</div>}

      <form action={action} className="space-y-4">
        <input type="hidden" name="patient_id" value={patientId} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="description" className={input.label}>
              Diagnosis description <span className={input.required}>*</span>
            </label>
            <input id="description" name="description" required className={input.base} />
            {state?.fieldErrors?.description && <p className={input.error}>{state.fieldErrors.description[0]}</p>}
          </div>

          <div>
            <label htmlFor="icd10_code" className={input.label}>ICD-10 Code</label>
            <input id="icd10_code" name="icd10_code" className={input.base} placeholder="e.g. J06.9" />
          </div>

          <div>
            <label htmlFor="status" className={input.label}>Status</label>
            <select id="status" name="status" className={input.base} defaultValue="ACTIVE">
              {DIAGNOSIS_STATUSES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="diagnosed_date" className={input.label}>
              Diagnosed date <span className={input.required}>*</span>
            </label>
            <input id="diagnosed_date" name="diagnosed_date" type="date" required
              defaultValue={new Date().toISOString().split('T')[0]} className={input.base} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={input.label}>Notes</label>
          <textarea id="notes" name="notes" rows={2} className={input.base} />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={btn.primary}>
            {pending ? 'Saving...' : 'Save diagnosis'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
