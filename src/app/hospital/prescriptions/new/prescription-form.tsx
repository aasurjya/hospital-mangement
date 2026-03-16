'use client'

import { useActionState } from 'react'
import { createPrescriptionAction, type PrescriptionActionState } from '../actions'
import { MEDICATION_ROUTES } from '@/lib/prescriptions/schemas'
import { btn, input, alert } from '@/lib/styles'
import { formatLabel } from '@/lib/format'

interface Props {
  patients: { id: string; full_name: string; mrn: string }[]
  formulary: { id: string; generic_name: string; brand_name: string | null; form: string; strength: string | null }[]
  defaultPatientId?: string
}

export function PrescriptionForm({ patients, formulary, defaultPatientId }: Props) {
  const [state, action, pending] = useActionState<PrescriptionActionState, FormData>(createPrescriptionAction, null)

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      {state?.error && <div className={`${alert.error} mb-4`} role="status" aria-live="polite">{state.error}</div>}
      {state?.allergyWarning && (
        <div className={`${alert.warning} mb-4`} role="alert" aria-live="assertive">
          <p className="font-medium">Drug-Allergy Warning</p>
          <p>{state.allergyWarning}</p>
          <p className="mt-2 text-xs">Check the override box below and provide a reason to proceed.</p>
        </div>
      )}

      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
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

          <div className="sm:col-span-2">
            <label htmlFor="drug_name" className={input.label}>
              Drug name <span className={input.required}>*</span>
            </label>
            <input id="drug_name" name="drug_name" required list="formulary-list" className={input.base} />
            <datalist id="formulary-list">
              {formulary.map((d) => (
                <option key={d.id} value={d.generic_name}>
                  {d.brand_name ? `${d.brand_name} — ` : ''}{d.form} {d.strength ?? ''}
                </option>
              ))}
            </datalist>
            <input type="hidden" name="drug_id" value="" />
          </div>

          <div>
            <label htmlFor="dosage" className={input.label}>
              Dosage <span className={input.required}>*</span>
            </label>
            <input id="dosage" name="dosage" required className={input.base} placeholder="e.g. 500mg" />
          </div>

          <div>
            <label htmlFor="route" className={input.label}>
              Route <span className={input.required}>*</span>
            </label>
            <select id="route" name="route" required className={input.base}>
              {MEDICATION_ROUTES.map((r) => (
                <option key={r} value={r}>{formatLabel(r)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="frequency" className={input.label}>
              Frequency <span className={input.required}>*</span>
            </label>
            <input id="frequency" name="frequency" required className={input.base} placeholder="e.g. TID, q8h, once daily" />
          </div>

          <div>
            <label htmlFor="duration" className={input.label}>Duration</label>
            <input id="duration" name="duration" className={input.base} placeholder="e.g. 7 days, 2 weeks" />
          </div>

          <div>
            <label htmlFor="quantity" className={input.label}>Quantity</label>
            <input id="quantity" name="quantity" type="number" min="1" className={input.base} />
          </div>

          <div>
            <label htmlFor="refills" className={input.label}>Refills</label>
            <input id="refills" name="refills" type="number" min="0" max="12" defaultValue="0" className={input.base} />
          </div>
        </div>

        {state?.allergyWarning && (
          <div className="rounded-md border border-error-200 bg-error-50 p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="allergy_override" className="rounded border-neutral-300" />
              <span className="font-medium text-error-700">I acknowledge the allergy risk and wish to proceed</span>
            </label>
            <div>
              <label htmlFor="allergy_override_reason" className={input.label}>Override reason</label>
              <input id="allergy_override_reason" name="allergy_override_reason" className={input.base}
                placeholder="Clinical justification for override" />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="notes" className={input.label}>Notes</label>
          <textarea id="notes" name="notes" rows={2} className={input.base} />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={btn.primary}>
            {pending ? 'Prescribing...' : 'Create Prescription'}
          </button>
          <a href="/hospital/prescriptions" className={btn.secondary}>Cancel</a>
        </div>
      </form>
    </div>
  )
}
