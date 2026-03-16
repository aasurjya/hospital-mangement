'use client'

import { useActionState } from 'react'
import { generateSoapNoteAction, type AiActionState } from './actions'
import { SuggestionResult } from './suggestion-result'
import { btn, input, alert } from '@/lib/styles'

export function SoapTab() {
  const [state, formAction, isPending] = useActionState<AiActionState, FormData>(
    generateSoapNoteAction, null
  )

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900">SOAP Note Generator</h2>
      <p className="text-sm text-neutral-600">Enter your clinical observations and the AI will structure them into SOAP format with ICD-10 codes.</p>

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
          <label htmlFor="observations" className={input.label}>
            Clinical Observations <span className="text-error-500">*</span>
          </label>
          <textarea id="observations" name="observations" rows={6} required disabled={isPending}
            minLength={10} maxLength={10000}
            placeholder="Describe your findings, examination results, patient complaints..."
            className={input.base} />
          <p className="mt-1 text-xs text-neutral-500">Minimum 10 characters</p>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={isPending} className={btn.primary}>
            {isPending ? 'Generating SOAP Note\u2026' : 'Generate SOAP Note'}
          </button>
          {state?.rateLimitRemaining !== undefined && (
            <span className="text-xs text-neutral-500">{state.rateLimitRemaining} requests remaining this hour</span>
          )}
        </div>
      </form>

      {state?.suggestionId && state?.output && (
        <SuggestionResult suggestionId={state.suggestionId} output={state.output} />
      )}
    </div>
  )
}
