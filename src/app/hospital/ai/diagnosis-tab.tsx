'use client'

import { useActionState } from 'react'
import { generateDiagnosisAction, type AiActionState } from './actions'
import { SuggestionResult } from './suggestion-result'
import { btn, input, alert } from '@/lib/styles'

export function DiagnosisTab() {
  const [state, formAction, isPending] = useActionState<AiActionState, FormData>(
    generateDiagnosisAction, null
  )

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900">Differential Diagnosis</h2>
      <p className="text-sm text-neutral-600">Enter patient symptoms to get AI-assisted differential diagnosis suggestions with ICD-10 codes.</p>

      <form action={formAction} className="space-y-4">
        {state?.error && <div role="alert" className={alert.error}>{state.error}</div>}

        <div>
          <label htmlFor="patient_id" className={input.label}>
            Patient ID <span className="text-error-500">*</span>
          </label>
          <input id="patient_id" name="patient_id" type="text" required disabled={isPending}
            placeholder="Enter patient ID" className={input.base} />
        </div>

        <div>
          <label htmlFor="symptoms" className={input.label}>
            Symptoms <span className="text-error-500">*</span>
          </label>
          <textarea id="symptoms" name="symptoms" rows={5} required disabled={isPending}
            minLength={10} maxLength={10000}
            placeholder="Describe presenting symptoms, onset, duration, severity, associated factors..."
            className={input.base} />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={isPending} className={btn.primary}>
            {isPending ? 'Analyzing Symptoms\u2026' : 'Suggest Diagnoses'}
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
