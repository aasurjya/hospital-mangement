'use client'

import { useActionState } from 'react'
import { createLabOrderAction, type LabActionState } from '../actions'
import { LAB_PRIORITIES } from '@/lib/labs/schemas'
import { btn, input, alert } from '@/lib/styles'
import { formatLabel } from '@/lib/format'

interface Props {
  patients: { id: string; full_name: string; mrn: string }[]
  catalogue: { id: string; test_name: string; test_code: string | null; sample_type: string }[]
  defaultPatientId?: string
}

export function LabOrderForm({ patients, catalogue, defaultPatientId }: Props) {
  const [state, action, pending] = useActionState<LabActionState, FormData>(createLabOrderAction, null)

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      {state?.error && <div className={`${alert.error} mb-4`} role="status" aria-live="polite">{state.error}</div>}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="patient_id" className={input.label}>
            Patient <span className={input.required}>*</span>
          </label>
          <select id="patient_id" name="patient_id" required className={input.base} defaultValue={defaultPatientId ?? ''}>
            <option value="">Select patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name} ({p.mrn})</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="test_name" className={input.label}>
            Test name <span className={input.required}>*</span>
          </label>
          <input id="test_name" name="test_name" required list="catalogue-list" className={input.base} />
          <datalist id="catalogue-list">
            {catalogue.map((t) => (
              <option key={t.id} value={t.test_name}>
                {t.test_code ? `[${t.test_code}] ` : ''}{formatLabel(t.sample_type)}
              </option>
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="priority" className={input.label}>
            Priority <span className={input.required}>*</span>
          </label>
          <select id="priority" name="priority" required className={input.base} defaultValue="ROUTINE">
            {LAB_PRIORITIES.map((p) => (
              <option key={p} value={p}>{formatLabel(p)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="clinical_notes" className={input.label}>Clinical Notes</label>
          <textarea id="clinical_notes" name="clinical_notes" rows={3} className={input.base} />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={btn.primary}>
            {pending ? 'Ordering...' : 'Create Lab Order'}
          </button>
          <a href="/hospital/labs" className={btn.secondary}>Cancel</a>
        </div>
      </form>
    </div>
  )
}
