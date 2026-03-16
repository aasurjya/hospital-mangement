'use client'

import { useActionState } from 'react'
import { createPatientAction, type PatientState } from '../actions'

const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'] as const

export default function NewPatientPage() {
  const [state, formAction, isPending] = useActionState<PatientState, FormData>(
    createPatientAction, null
  )

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <a href="/hospital/patients" className="text-sm text-neutral-500 hover:text-neutral-700">← Patients</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Register patient</h1>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200">{state.error}</div>
          )}

          <Section title="Personal details">
            <Field label="Full name" name="full_name" required error={state?.fieldErrors?.full_name?.[0]}>
              <input id="full_name" name="full_name" type="text" required disabled={isPending} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date of birth" name="date_of_birth" error={state?.fieldErrors?.date_of_birth?.[0]}>
                <input id="date_of_birth" name="date_of_birth" type="date" disabled={isPending} className={inputCls} />
              </Field>
              <Field label="Gender" name="gender" error={state?.fieldErrors?.gender?.[0]}>
                <select id="gender" name="gender" disabled={isPending} className={inputCls}>
                  <option value="">Select…</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Blood type" name="blood_type" error={state?.fieldErrors?.blood_type?.[0]}>
                <select id="blood_type" name="blood_type" disabled={isPending} className={inputCls}>
                  <option value="UNKNOWN">Unknown</option>
                  {BLOOD_TYPES.filter(b => b !== 'UNKNOWN').map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Phone" name="phone" error={state?.fieldErrors?.phone?.[0]}>
                <input id="phone" name="phone" type="tel" disabled={isPending} className={inputCls} />
              </Field>
            </div>
            <Field label="Email" name="email" error={state?.fieldErrors?.email?.[0]}>
              <input id="email" name="email" type="email" disabled={isPending} className={inputCls} />
            </Field>
            <Field label="Address" name="address" error={state?.fieldErrors?.address?.[0]}>
              <input id="address" name="address" type="text" disabled={isPending} className={inputCls} />
            </Field>
          </Section>

          <Section title="Emergency contact">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact name" name="emergency_contact_name">
                <input id="emergency_contact_name" name="emergency_contact_name" type="text" disabled={isPending} className={inputCls} />
              </Field>
              <Field label="Contact phone" name="emergency_contact_phone">
                <input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" disabled={isPending} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="Insurance">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Provider" name="insurance_provider">
                <input id="insurance_provider" name="insurance_provider" type="text" disabled={isPending} className={inputCls} />
              </Field>
              <Field label="Number" name="insurance_number">
                <input id="insurance_number" name="insurance_number" type="text" disabled={isPending} className={inputCls} />
              </Field>
            </div>
          </Section>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending}
              className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {isPending ? 'Registering…' : 'Register patient'}
            </button>
            <a href="/hospital/patients" className="py-2 text-sm text-neutral-500 hover:text-neutral-700">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputCls = 'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-neutral-700 border-b pb-1">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, name, required, error, children }: { label: string; name: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-neutral-700">
        {label}{required && <span className="ml-0.5 text-error-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  )
}
