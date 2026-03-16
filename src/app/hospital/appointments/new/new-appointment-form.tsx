'use client'

import { useActionState, useState } from 'react'
import { createAppointmentAction, type AppointmentState } from '../actions'

interface Props {
  hospitalId: string
  doctors: { id: string; full_name: string }[]
  departments: { id: string; name: string }[]
  preselectedPatient: { id: string; full_name: string; mrn: string } | null
}

export function NewAppointmentForm({ doctors, departments, preselectedPatient }: Props) {
  const [state, formAction, isPending] = useActionState<AppointmentState, FormData>(
    createAppointmentAction, null
  )
  const [patientSearch, setPatientSearch] = useState(
    preselectedPatient ? `${preselectedPatient.full_name} (${preselectedPatient.mrn})` : ''
  )

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200">{state.error}</div>
      )}

      {/* Patient — hidden field with preselected or user-typed UUID */}
      {preselectedPatient ? (
        <>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Patient <span className="text-error-500">*</span></label>
            <div className="mt-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900">
              {preselectedPatient.full_name} <span className="text-neutral-400">({preselectedPatient.mrn})</span>
            </div>
            <input type="hidden" name="patient_id" value={preselectedPatient.id} />
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="patient_id" className="block text-sm font-medium text-neutral-700">
            Patient ID (UUID) <span className="text-error-500">*</span>
          </label>
          <input id="patient_id" name="patient_id" type="text" required disabled={isPending}
            placeholder="Paste patient UUID from patient page"
            className={inputCls} />
          {state?.fieldErrors?.patient_id?.[0] && (
            <p className="mt-1 text-xs text-error-600">{state.fieldErrors.patient_id[0]}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="scheduled_at" className="block text-sm font-medium text-neutral-700">
          Date & time <span className="text-error-500">*</span>
        </label>
        <input id="scheduled_at" name="scheduled_at" type="datetime-local" required disabled={isPending} className={inputCls} />
        {state?.fieldErrors?.scheduled_at?.[0] && <p className="mt-1 text-xs text-error-600">{state.fieldErrors.scheduled_at[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="doctor_id" className="block text-sm font-medium text-neutral-700">Doctor</label>
          <select id="doctor_id" name="doctor_id" disabled={isPending} className={inputCls}>
            <option value="">Unassigned</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="department_id" className="block text-sm font-medium text-neutral-700">Department</label>
          <select id="department_id" name="department_id" disabled={isPending} className={inputCls}>
            <option value="">None</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="duration_minutes" className="block text-sm font-medium text-neutral-700">Duration (min)</label>
          <input id="duration_minutes" name="duration_minutes" type="number" min="5" max="480" defaultValue="30" disabled={isPending} className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-neutral-700">Reason</label>
        <input id="reason" name="reason" type="text" disabled={isPending} className={inputCls} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending}
          className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
          {isPending ? 'Booking…' : 'Book appointment'}
        </button>
        <a href="/hospital/appointments" className="py-2 text-sm text-neutral-500 hover:text-neutral-700">Cancel</a>
      </div>
    </form>
  )
}

const inputCls = 'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'
