'use client'

import { useActionState, useState } from 'react'
import { recordVitalsAction, type VitalsActionState } from './actions'
import { btn, input, alert } from '@/lib/styles'

export function VitalsForm({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<VitalsActionState, FormData>(recordVitalsAction, null)

  if (state?.success) {
    setOpen(false)
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btn.primary}>
        + Record Vitals
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="mb-4 text-base font-medium text-neutral-900">Record Vital Signs</h2>
      {state?.error && <div className={`${alert.error} mb-4`} role="status" aria-live="polite">{state.error}</div>}

      <form action={action} className="space-y-4">
        <input type="hidden" name="patient_id" value={patientId} />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="systolic_bp" className={input.label}>Systolic BP</label>
            <input id="systolic_bp" name="systolic_bp" type="number" placeholder="120" className={input.base} />
          </div>
          <div>
            <label htmlFor="diastolic_bp" className={input.label}>Diastolic BP</label>
            <input id="diastolic_bp" name="diastolic_bp" type="number" placeholder="80" className={input.base} />
          </div>
          <div>
            <label htmlFor="heart_rate" className={input.label}>Heart Rate (bpm)</label>
            <input id="heart_rate" name="heart_rate" type="number" placeholder="72" className={input.base} />
          </div>
          <div>
            <label htmlFor="temperature" className={input.label}>Temperature (°C)</label>
            <input id="temperature" name="temperature" type="number" step="0.1" placeholder="36.6" className={input.base} />
          </div>
          <div>
            <label htmlFor="respiratory_rate" className={input.label}>Respiratory Rate</label>
            <input id="respiratory_rate" name="respiratory_rate" type="number" placeholder="16" className={input.base} />
          </div>
          <div>
            <label htmlFor="o2_saturation" className={input.label}>SpO2 (%)</label>
            <input id="o2_saturation" name="o2_saturation" type="number" placeholder="98" className={input.base} />
          </div>
          <div>
            <label htmlFor="weight_kg" className={input.label}>Weight (kg)</label>
            <input id="weight_kg" name="weight_kg" type="number" step="0.1" placeholder="70" className={input.base} />
          </div>
          <div>
            <label htmlFor="height_cm" className={input.label}>Height (cm)</label>
            <input id="height_cm" name="height_cm" type="number" step="0.1" placeholder="170" className={input.base} />
          </div>
          <div>
            <label htmlFor="pain_scale" className={input.label}>Pain Scale (0-10)</label>
            <input id="pain_scale" name="pain_scale" type="number" min="0" max="10" placeholder="0" className={input.base} />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={input.label}>Notes</label>
          <textarea id="notes" name="notes" rows={2} className={input.base} />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={btn.primary}>
            {pending ? 'Saving...' : 'Save vitals'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
