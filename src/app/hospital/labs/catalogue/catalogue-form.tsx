'use client'

import { useActionState, useState } from 'react'
import { createLabCatalogueItemAction, type LabActionState } from '../actions'
import { LAB_SAMPLE_TYPES } from '@/lib/labs/schemas'
import { btn, input, alert } from '@/lib/styles'
import { formatLabel } from '@/lib/format'

export function CatalogueForm() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<LabActionState, FormData>(createLabCatalogueItemAction, null)

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btn.primary}>
        + Add Test
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="mb-4 text-base font-medium text-neutral-900">Add Lab Test</h2>
      {state?.error && <div className={`${alert.error} mb-4`} role="status" aria-live="polite">{state.error}</div>}

      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="test_name" className={input.label}>
              Test Name <span className={input.required}>*</span>
            </label>
            <input id="test_name" name="test_name" required className={input.base} />
          </div>
          <div>
            <label htmlFor="test_code" className={input.label}>Code</label>
            <input id="test_code" name="test_code" className={input.base} placeholder="e.g. CBC, BMP" />
          </div>
          <div>
            <label htmlFor="category" className={input.label}>Category</label>
            <input id="category" name="category" className={input.base} placeholder="e.g. Hematology" />
          </div>
          <div>
            <label htmlFor="sample_type" className={input.label}>
              Sample Type <span className={input.required}>*</span>
            </label>
            <select id="sample_type" name="sample_type" required className={input.base}>
              {LAB_SAMPLE_TYPES.map((s) => (
                <option key={s} value={s}>{formatLabel(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="normal_range" className={input.label}>Normal Range</label>
            <input id="normal_range" name="normal_range" className={input.base} placeholder="e.g. 70-100" />
          </div>
          <div>
            <label htmlFor="unit" className={input.label}>Unit</label>
            <input id="unit" name="unit" className={input.base} placeholder="e.g. mg/dL" />
          </div>
          <div>
            <label htmlFor="turnaround_hours" className={input.label}>TAT (hours)</label>
            <input id="turnaround_hours" name="turnaround_hours" type="number" min="1" className={input.base} />
          </div>
          <div>
            <label htmlFor="price" className={input.label}>Price</label>
            <input id="price" name="price" type="number" step="0.01" min="0" className={input.base} />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={btn.primary}>
            {pending ? 'Adding...' : 'Add to Catalogue'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
