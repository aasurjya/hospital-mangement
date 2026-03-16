'use client'

import { useActionState, useState } from 'react'
import { createStaffAction, type CreateStaffState } from '../actions'
import { STAFF_ROLES } from '@/lib/rbac/constants'
import { formatLabel } from '@/lib/format'
import type { AppRole } from '@/types/database'

const CLINICAL_ROLES: AppRole[] = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN']
const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONSULTANT'] as const

export default function NewStaffPage() {
  const [state, formAction, isPending] = useActionState<CreateStaffState, FormData>(
    createStaffAction, { status: 'idle' }
  )
  const [copied, setCopied] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')

  const isClinicalRole = CLINICAL_ROLES.includes(selectedRole as AppRole)

  if (state.status === 'success') {
    return (
      <div role="status" aria-live="polite" className="mx-auto max-w-lg p-6 space-y-4">
        <div className="rounded-md bg-success-50 p-4 border border-success-200">
          <h3 className="text-sm font-semibold text-success-800">Account created</h3>
          <p className="mt-1 text-sm text-success-700">
            <strong>{state.fullName}</strong> ({formatLabel(state.role)}) — {state.email}
          </p>
        </div>
        <div role="alert" aria-live="assertive" className="rounded-md border border-warning-200 bg-warning-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-warning-700 mb-2">Temporary password — shown once only</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-sm border border-warning-200 select-all">{state.tempPassword}</code>
            <button type="button"
              aria-label="Copy temporary password to clipboard"
              onClick={async () => { await navigator.clipboard.writeText(state.tempPassword); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="rounded-md border border-warning-300 bg-white px-3 py-2 text-sm font-medium text-warning-700 hover:bg-warning-50">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-xs text-warning-800">Not shown again. Share it securely before leaving.</p>
        </div>
        <div className="flex gap-3">
          <a href="/hospital/staff/new" className="inline-flex items-center min-h-[44px] rounded-md border border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50">Add another</a>
          <a href="/hospital/staff" className="inline-flex items-center min-h-[44px] rounded-md bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700">Back to staff</a>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <a href="/hospital/staff" className="text-sm text-neutral-600 hover:text-neutral-800">
          <span aria-hidden="true">&larr; </span>Staff
        </a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Add staff member</h1>
      </div>
      <form action={formAction} className="space-y-6">
        {state.status === 'error' && state.error && (
          <div role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200">{state.error}</div>
        )}

        {/* Basic Information */}
        <fieldset className="rounded-lg border border-neutral-200 bg-white p-6">
          <legend className="text-base font-semibold text-neutral-900 px-1">Basic Information</legend>
          <div className="space-y-4 mt-2">
            <Field label="Full name" name="full_name" required error={fieldError(state, 'full_name')}>
              <input id="full_name" name="full_name" type="text" required aria-required="true" disabled={isPending}
                autoComplete="name" placeholder="Dr. Jane Smith" className={inputCls} />
            </Field>

            <Field label="Email" name="email" required error={fieldError(state, 'email')}>
              <input id="email" name="email" type="email" required aria-required="true" disabled={isPending}
                autoComplete="email" className={inputCls} />
            </Field>

            <Field label="Role" name="role" required error={fieldError(state, 'role')}>
              <select id="role" name="role" required aria-required="true" disabled={isPending}
                className={inputCls} onChange={(e) => setSelectedRole(e.target.value)}>
                <option value="">Select role&hellip;</option>
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>{formatLabel(r)}</option>
                ))}
              </select>
            </Field>

            <Field label="Phone" name="phone" error={fieldError(state, 'phone')}>
              <input id="phone" name="phone" type="tel" disabled={isPending}
                autoComplete="tel" placeholder="+1 (555) 000-0000" className={inputCls} />
            </Field>

            <Field label="Address" name="address" error={fieldError(state, 'address')}>
              <input id="address" name="address" type="text" disabled={isPending}
                autoComplete="street-address" className={inputCls} />
            </Field>
          </div>
        </fieldset>

        {/* Professional Information — shown for clinical roles */}
        {isClinicalRole && (
          <fieldset className="rounded-lg border border-neutral-200 bg-white p-6">
            <legend className="text-base font-semibold text-neutral-900 px-1">Professional Information</legend>
            <div className="space-y-4 mt-2">
              <Field label="Specialty / Specialization" name="specialty" error={fieldError(state, 'specialty')}>
                <input id="specialty" name="specialty" type="text" disabled={isPending}
                  placeholder="e.g. Cardiology, Pediatrics" className={inputCls} />
              </Field>

              <Field label="Qualifications" name="qualifications" error={fieldError(state, 'qualifications')}>
                <input id="qualifications" name="qualifications" type="text" disabled={isPending}
                  placeholder="e.g. MBBS, MD (Internal Medicine)" className={inputCls} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="License number" name="license_number" error={fieldError(state, 'license_number')}>
                  <input id="license_number" name="license_number" type="text" disabled={isPending}
                    placeholder="e.g. KMP&DB/12345" className={inputCls} />
                </Field>

                <Field label="License expiry" name="license_expiry" error={fieldError(state, 'license_expiry')}>
                  <input id="license_expiry" name="license_expiry" type="date" disabled={isPending} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Registration number" name="registration_number" error={fieldError(state, 'registration_number')}>
                  <input id="registration_number" name="registration_number" type="text" disabled={isPending}
                    placeholder="e.g. NMC-67890" className={inputCls} />
                </Field>

                <Field label="Years of experience" name="years_of_experience" error={fieldError(state, 'years_of_experience')}>
                  <input id="years_of_experience" name="years_of_experience" type="number" min="0" max="70" disabled={isPending}
                    className={inputCls} />
                </Field>
              </div>
            </div>
          </fieldset>
        )}

        {/* Employment Information */}
        <fieldset className="rounded-lg border border-neutral-200 bg-white p-6">
          <legend className="text-base font-semibold text-neutral-900 px-1">Employment Information</legend>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Employment type" name="employment_type" error={fieldError(state, 'employment_type')}>
                <select id="employment_type" name="employment_type" disabled={isPending} className={inputCls}>
                  <option value="">Select&hellip;</option>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{formatLabel(t)}</option>
                  ))}
                </select>
              </Field>

              <Field label="Hire date" name="hire_date" error={fieldError(state, 'hire_date')}>
                <input id="hire_date" name="hire_date" type="date" disabled={isPending} className={inputCls} />
              </Field>
            </div>
          </div>
        </fieldset>

        {/* Emergency Contact */}
        <fieldset className="rounded-lg border border-neutral-200 bg-white p-6">
          <legend className="text-base font-semibold text-neutral-900 px-1">Emergency Contact</legend>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact name" name="emergency_contact_name" error={fieldError(state, 'emergency_contact_name')}>
                <input id="emergency_contact_name" name="emergency_contact_name" type="text" disabled={isPending}
                  className={inputCls} />
              </Field>

              <Field label="Contact phone" name="emergency_contact_phone" error={fieldError(state, 'emergency_contact_phone')}>
                <input id="emergency_contact_phone" name="emergency_contact_phone" type="tel" disabled={isPending}
                  className={inputCls} />
              </Field>
            </div>
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button type="submit" disabled={isPending}
            className="rounded-md bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors min-h-[44px]">
            {isPending ? 'Creating\u2026' : 'Create account'}
          </button>
          <a href="/hospital/staff" className="inline-flex items-center min-h-[44px] px-3 text-sm text-neutral-600 hover:text-neutral-800">Cancel</a>
        </div>
      </form>
    </div>
  )
}

const inputCls = 'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'

function fieldError(state: CreateStaffState, field: string): string | undefined {
  if (state.status === 'error' && state.fieldErrors) {
    return (state.fieldErrors as Record<string, string[]>)[field]?.[0]
  }
  return undefined
}

function Field({ label, name, required, error, children }: { label: string; name: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-neutral-700">
        {label}{required && <span className="ml-1 text-error-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  )
}
