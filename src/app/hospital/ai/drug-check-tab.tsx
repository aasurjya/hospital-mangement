'use client'

import { useActionState, useState } from 'react'
import { generateDrugInteractionAction, type AiActionState } from './actions'
import { SuggestionResult } from './suggestion-result'
import { btn, input, alert } from '@/lib/styles'

export function DrugCheckTab() {
  const [medications, setMedications] = useState(['', ''])
  const [state, formAction, isPending] = useActionState<AiActionState, FormData>(
    generateDrugInteractionAction, null
  )

  function addMedication() {
    if (medications.length >= 20) return
    setMedications((prev) => [...prev, ''])
  }

  function removeMedication(index: number) {
    if (medications.length <= 2) return
    setMedications((prev) => prev.filter((_, i) => i !== index))
  }

  function updateMedication(index: number, value: string) {
    setMedications((prev) => prev.map((m, i) => (i === index ? value : m)))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-neutral-900">Drug Interaction Checker</h2>
      <p className="text-sm text-neutral-600">Enter medications to check for known drug-drug interactions.</p>

      <form action={formAction} className="space-y-4">
        {state?.error && <div role="alert" className={alert.error}>{state.error}</div>}

        <div>
          <label htmlFor="patient_id" className={input.label}>
            Patient ID <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <input id="patient_id" name="patient_id" type="text" disabled={isPending}
            placeholder="Enter patient ID" className={input.base} />
        </div>

        <fieldset>
          <legend className={input.label}>
            Medications <span className="text-error-500">*</span>
            <span className="text-neutral-400 font-normal ml-1">(minimum 2)</span>
          </legend>
          <div className="mt-2 space-y-2">
            {medications.map((med, index) => (
              <div key={index} className="flex gap-2">
                <input
                  name="medications"
                  type="text"
                  value={med}
                  onChange={(e) => updateMedication(index, e.target.value)}
                  disabled={isPending}
                  placeholder={`Medication ${index + 1}`}
                  className={`${input.base} mt-0 flex-1`}
                  required
                />
                {medications.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    className="text-sm text-error-600 hover:text-error-800 min-h-[44px] px-2"
                    aria-label={`Remove medication ${index + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {medications.length < 20 && (
            <button
              type="button"
              onClick={addMedication}
              className="mt-2 text-sm text-primary-600 hover:text-primary-800 min-h-[44px]"
            >
              + Add medication
            </button>
          )}
        </fieldset>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={isPending} className={btn.primary}>
            {isPending ? 'Checking Interactions\u2026' : 'Check Interactions'}
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
