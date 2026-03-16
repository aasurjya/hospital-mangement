'use client'

import { useActionState, useState } from 'react'
import { enterLabResultAction, type LabActionState } from '../actions'
import { btn, input, alert } from '@/lib/styles'

export function LabResultForm({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const boundAction = enterLabResultAction.bind(null, orderId)
  const [state, action, pending] = useActionState<LabActionState, FormData>(boundAction, null)

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btn.primary}>
        + Enter Result
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="mb-4 text-base font-medium text-neutral-900">Enter Lab Result</h2>
      {state?.error && <div className={`${alert.error} mb-4`} role="status" aria-live="polite">{state.error}</div>}

      <form action={action} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="result_value" className={input.label}>
              Result <span className={input.required}>*</span>
            </label>
            <input id="result_value" name="result_value" required className={input.base} />
          </div>

          <div>
            <label htmlFor="unit" className={input.label}>Unit</label>
            <input id="unit" name="unit" className={input.base} placeholder="e.g. mg/dL, mmol/L" />
          </div>

          <div>
            <label htmlFor="normal_range" className={input.label}>Normal Range</label>
            <input id="normal_range" name="normal_range" className={input.base} placeholder="e.g. 70-100" />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_abnormal" className="rounded border-neutral-300" />
          <span className="font-medium text-error-700">Flag as abnormal</span>
        </label>

        <div>
          <label htmlFor="interpretation" className={input.label}>Interpretation</label>
          <textarea id="interpretation" name="interpretation" rows={2} className={input.base} />
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={btn.primary}>
            {pending ? 'Saving...' : 'Save Result'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
