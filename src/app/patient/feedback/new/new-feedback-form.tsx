'use client'

import { useActionState } from 'react'
import { createFeedbackAction, type FeedbackActionState } from '../actions'
import { btn, input, alert } from '@/lib/styles'

interface FeedbackOption {
  id: string
  label: string
  type: 'appointment' | 'admission'
}

interface Props {
  options: FeedbackOption[]
}

export function NewFeedbackForm({ options }: Props) {
  const [state, formAction, isPending] = useActionState<FeedbackActionState, FormData>(
    createFeedbackAction, null
  )

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <div role="alert" className={alert.error}>{state.error}</div>}

      <div>
        <label htmlFor="visit_select" className={input.label}>
          Select Visit to Review <span className={input.required}>*</span>
        </label>
        {options.length === 0 ? (
          <p className="mt-1 text-sm text-neutral-500">No completed appointments or discharged admissions to review.</p>
        ) : (
          <select id="visit_select" name="visit_select" required disabled={isPending} className={input.base}
            onChange={(e) => {
              const opt = options.find((o) => `${o.type}:${o.id}` === e.target.value)
              const apptInput = document.getElementById('appointment_id_hidden') as HTMLInputElement
              const admInput = document.getElementById('admission_id_hidden') as HTMLInputElement
              if (apptInput) apptInput.value = opt?.type === 'appointment' ? opt.id : ''
              if (admInput) admInput.value = opt?.type === 'admission' ? opt.id : ''
            }}>
            <option value="">Select a visit&hellip;</option>
            {options.map((opt) => (
              <option key={`${opt.type}:${opt.id}`} value={`${opt.type}:${opt.id}`}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        <input type="hidden" id="appointment_id_hidden" name="appointment_id" />
        <input type="hidden" id="admission_id_hidden" name="admission_id" />
      </div>

      <div>
        <label htmlFor="rating" className={input.label}>
          Rating <span className={input.required}>*</span>
        </label>
        <select id="rating" name="rating" required disabled={isPending} className={input.base}>
          <option value="">Select rating&hellip;</option>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Good</option>
          <option value="3">3 - Average</option>
          <option value="2">2 - Poor</option>
          <option value="1">1 - Very Poor</option>
        </select>
      </div>

      <div>
        <label htmlFor="comment" className={input.label}>
          Comment <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <textarea id="comment" name="comment" rows={4} disabled={isPending}
          maxLength={1000} placeholder="Share your experience..." className={input.base} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending || options.length === 0} className={btn.primary}>
          {isPending ? 'Submitting\u2026' : 'Submit Feedback'}
        </button>
        <a href="/patient/feedback" className={`inline-flex items-center min-h-[44px] px-3 ${btn.ghost}`}>Cancel</a>
      </div>
    </form>
  )
}
