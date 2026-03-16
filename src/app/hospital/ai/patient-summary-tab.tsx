'use client'

import { useActionState } from 'react'
import { generatePatientSummaryAction, type AiActionState } from './actions'
import { SuggestionResult } from './suggestion-result'
import { btn, input, alert } from '@/lib/styles'

export function PatientSummaryTab() {
  const [state, formAction, isPending] = useActionState<AiActionState, FormData>(
    generatePatientSummaryAction, null
  )

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900">Patient History Summary</h2>
      <p className="text-sm text-neutral-600">Generate a comprehensive summary of a patient&apos;s clinical history from existing records.</p>

      <form action={formAction} className="space-y-4">
        {state?.error && <div role="alert" className={alert.error}>{state.error}</div>}

        <div>
          <label htmlFor="patient_id" className={input.label}>
            Patient ID <span className="text-error-500">*</span>
          </label>
          <input id="patient_id" name="patient_id" type="text" required disabled={isPending}
            placeholder="Enter patient ID" className={input.base} />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={isPending} className={btn.primary}>
            {isPending ? 'Generating Summary\u2026' : 'Generate Summary'}
          </button>
          {state?.rateLimitRemaining !== undefined && (
            <span className="text-xs text-neutral-500">{state.rateLimitRemaining} remaining</span>
          )}
        </div>
      </form>

      {state?.suggestionId && state?.output && (
        <SuggestionResult suggestionId={state.suggestionId} output={state.output} />
      )}
    </div>
  )
}
