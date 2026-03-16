'use client'

import { useActionState } from 'react'
import { createMedicalRecordAction, type RecordState } from '../actions'

interface Props {
  preselectedPatient: { id: string; full_name: string; mrn: string } | null
}

export function NewRecordForm({ preselectedPatient }: Props) {
  const [state, formAction, isPending] = useActionState<RecordState, FormData>(
    createMedicalRecordAction, null
  )

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200">{state.error}</div>
      )}

      {preselectedPatient ? (
        <div>
          <label className="block text-sm font-medium text-neutral-700">Patient <span className="text-error-500">*</span></label>
          <div className="mt-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900">
            {preselectedPatient.full_name} <span className="text-neutral-400">({preselectedPatient.mrn})</span>
          </div>
          <input type="hidden" name="patient_id" value={preselectedPatient.id} />
        </div>
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
        <label htmlFor="chief_complaint" className="block text-sm font-medium text-neutral-700">Chief complaint</label>
        <input id="chief_complaint" name="chief_complaint" type="text" disabled={isPending} className={inputCls} />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-neutral-700">Notes</label>
        <textarea id="notes" name="notes" rows={6} disabled={isPending} className={inputCls} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isPending}
          className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
          {isPending ? 'Saving…' : 'Save as draft'}
        </button>
        <a href="/hospital/records" className="py-2 text-sm text-neutral-500 hover:text-neutral-700">Cancel</a>
      </div>
    </form>
  )
}

const inputCls = 'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'
