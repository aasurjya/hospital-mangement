'use client'

import { useActionState, useState } from 'react'
import { createAllergyAction, type AllergyActionState } from './actions'
import { ALLERGEN_TYPES, ALLERGY_SEVERITIES } from '@/lib/clinical/schemas'
import { btn, input, alert } from '@/lib/styles'
import { formatLabel } from '@/lib/format'

export function AllergyForm({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<AllergyActionState, FormData>(createAllergyAction, null)

  if (state?.success) {
    setOpen(false)
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btn.primary}>
        + Record Allergy
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="mb-4 text-base font-medium text-neutral-900">Record Allergy</h2>
      {state?.error && <div className={`${alert.error} mb-4`} role="status" aria-live="polite">{state.error}</div>}

      <form action={action} className="space-y-4">
        <input type="hidden" name="patient_id" value={patientId} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="allergen_name" className={input.label}>
              Allergen name <span className={input.required}>*</span>
            </label>
            <input id="allergen_name" name="allergen_name" required className={input.base} />
            {state?.fieldErrors?.allergen_name && <p className={input.error}>{state.fieldErrors.allergen_name[0]}</p>}
          </div>

          <div>
            <label htmlFor="allergen_type" className={input.label}>
              Type <span className={input.required}>*</span>
            </label>
            <select id="allergen_type" name="allergen_type" required className={input.base}>
              {ALLERGEN_TYPES.map((t) => (
                <option key={t} value={t}>{formatLabel(t)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="severity" className={input.label}>
              Severity <span className={input.required}>*</span>
            </label>
            <select id="severity" name="severity" required className={input.base}>
              {ALLERGY_SEVERITIES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="onset_date" className={input.label}>Onset date</label>
            <input id="onset_date" name="onset_date" type="date" className={input.base} />
          </div>
        </div>

        <div>
          <label htmlFor="reaction" className={input.label}>Reaction</label>
          <input id="reaction" name="reaction" className={input.base} placeholder="e.g. Hives, swelling, anaphylaxis" />
        </div>

        <div>
          <label htmlFor="notes" className={input.label}>Notes</label>
          <textarea id="notes" name="notes" rows={2} className={input.base} />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={btn.primary}>
            {pending ? 'Saving...' : 'Save allergy'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
