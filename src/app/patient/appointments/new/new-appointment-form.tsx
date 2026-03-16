'use client'

import { useActionState } from 'react'
import { requestAppointmentAction, type AppointmentActionState } from '../actions'
import { btn, input, alert } from '@/lib/styles'

interface Doctor {
  id: string
  full_name: string
}

interface Department {
  id: string
  name: string
}

interface Props {
  doctors: Doctor[]
  departments: Department[]
}

export function NewAppointmentForm({ doctors, departments }: Props) {
  const [state, formAction, isPending] = useActionState<AppointmentActionState, FormData>(
    requestAppointmentAction, null
  )

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <div role="alert" className={alert.error}>{state.error}</div>}

      <div>
        <label htmlFor="doctor_id" className={input.label}>
          Doctor <span className={input.required}>*</span>
        </label>
        <select id="doctor_id" name="doctor_id" required disabled={isPending} className={input.base}>
          <option value="">Select a doctor&hellip;</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.full_name}</option>
          ))}
        </select>
        {state?.fieldErrors?.doctor_id && <p className={input.error}>{state.fieldErrors.doctor_id[0]}</p>}
      </div>

      <div>
        <label htmlFor="department_id" className={input.label}>
          Department <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <select id="department_id" name="department_id" disabled={isPending} className={input.base}>
          <option value="">Any department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="scheduled_at" className={input.label}>
          Preferred Date &amp; Time <span className={input.required}>*</span>
        </label>
        <input id="scheduled_at" name="scheduled_at" type="datetime-local" required disabled={isPending}
          min={new Date().toISOString().slice(0, 16)} className={input.base} />
        {state?.fieldErrors?.scheduled_at && <p className={input.error}>{state.fieldErrors.scheduled_at[0]}</p>}
      </div>

      <div>
        <label htmlFor="reason" className={input.label}>
          Reason <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <textarea id="reason" name="reason" rows={3} disabled={isPending}
          maxLength={500} placeholder="Describe your reason for the visit" className={input.base} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending} className={btn.primary}>
          {isPending ? 'Booking\u2026' : 'Book Appointment'}
        </button>
        <a href="/patient/appointments" className={`inline-flex items-center min-h-[44px] px-3 ${btn.ghost}`}>Cancel</a>
      </div>
    </form>
  )
}
