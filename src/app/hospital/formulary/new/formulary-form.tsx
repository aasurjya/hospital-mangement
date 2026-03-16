'use client'

import { useActionState } from 'react'
import { createFormularyItemAction, type FormularyActionState } from '../../prescriptions/actions'
import { DRUG_FORMS, DRUG_CATEGORIES } from '@/lib/prescriptions/schemas'
import { btn, input, alert } from '@/lib/styles'
import { formatLabel } from '@/lib/format'

export function FormularyForm() {
  const [state, action, pending] = useActionState<FormularyActionState, FormData>(createFormularyItemAction, null)

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      {state?.error && <div className={`${alert.error} mb-4`} role="status" aria-live="polite">{state.error}</div>}

      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="generic_name" className={input.label}>
              Generic Name <span className={input.required}>*</span>
            </label>
            <input id="generic_name" name="generic_name" required className={input.base} />
            {state?.fieldErrors?.generic_name && <p className={input.error}>{state.fieldErrors.generic_name[0]}</p>}
          </div>

          <div>
            <label htmlFor="brand_name" className={input.label}>Brand Name</label>
            <input id="brand_name" name="brand_name" className={input.base} />
          </div>

          <div>
            <label htmlFor="form" className={input.label}>
              Form <span className={input.required}>*</span>
            </label>
            <select id="form" name="form" required className={input.base}>
              {DRUG_FORMS.map((f) => (
                <option key={f} value={f}>{formatLabel(f)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="strength" className={input.label}>Strength</label>
            <input id="strength" name="strength" className={input.base} placeholder="e.g. 500mg, 10mg/ml" />
          </div>

          <div>
            <label htmlFor="category" className={input.label}>
              Category <span className={input.required}>*</span>
            </label>
            <select id="category" name="category" required className={input.base}>
              {DRUG_CATEGORIES.map((c) => (
                <option key={c} value={c}>{formatLabel(c)}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={input.label}>Notes</label>
          <textarea id="notes" name="notes" rows={2} className={input.base} />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={btn.primary}>
            {pending ? 'Adding...' : 'Add to Formulary'}
          </button>
          <a href="/hospital/formulary" className={btn.secondary}>Cancel</a>
        </div>
      </form>
    </div>
  )
}
