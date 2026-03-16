'use client'

import { useActionState, useState } from 'react'
import {
  updateStaffAction,
  toggleStaffStatusAction,
  resetStaffPasswordAction,
  type EditProfileState,
  type ToggleStatusState,
  type ResetPasswordState,
} from './actions'
import { STAFF_ROLES } from '@/lib/rbac/constants'
import { formatLabel } from '@/lib/format'
import type { AppRole, EmploymentType } from '@/types/database'

const CLINICAL_ROLES: AppRole[] = ['DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN']
const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CONSULTANT']

interface StaffData {
  full_name: string
  phone: string
  role: AppRole
  is_active: boolean
  address: string
  specialty: string
  qualifications: string
  license_number: string
  license_expiry: string
  registration_number: string
  years_of_experience: number | null
  employment_type: EmploymentType | null
  hire_date: string
  emergency_contact_name: string
  emergency_contact_phone: string
  department_id: string
}

interface Props {
  staffId: string
  targetRole: AppRole
  initialData: StaffData
  departments: { id: string; name: string }[]
}

const inputCls =
  'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'

export function EditStaffForm({ staffId, targetRole, initialData, departments }: Props) {
  const [isActive, setIsActive] = useState(initialData.is_active)
  const [selectedRole, setSelectedRole] = useState<AppRole>(initialData.role)
  const isHospitalAdmin = targetRole === 'HOSPITAL_ADMIN'
  const isClinicalRole = CLINICAL_ROLES.includes(selectedRole)

  // 1. Profile update
  const boundUpdate = updateStaffAction.bind(null, staffId)
  const [profileState, profileAction, profilePending] = useActionState<EditProfileState, FormData>(
    boundUpdate,
    null
  )

  // 2. Status toggle
  const [statusState, setStatusState] = useState<ToggleStatusState>(null)
  const [statusPending, setStatusPending] = useState(false)

  async function handleToggle() {
    const action = isActive ? 'Deactivate' : 'Reactivate'
    const warning = isActive ? ' They will immediately lose login access.' : ''
    if (!confirm(`${action} ${initialData.full_name}?${warning}`)) return
    setStatusPending(true)
    const result = await toggleStaffStatusAction(staffId, !isActive)
    setStatusState(result)
    if (result?.status === 'success') setIsActive(result.isActive)
    setStatusPending(false)
  }

  // 3. Password reset
  const [resetState, setResetState] = useState<ResetPasswordState>(null)
  const [resetPending, setResetPending] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleReset() {
    if (!confirm(`Reset password for ${initialData.full_name}? Their current password will be invalidated immediately.`)) return
    setResetPending(true)
    const result = await resetStaffPasswordAction(staffId)
    setResetState(result)
    setResetPending(false)
  }

  return (
    <div className="space-y-6">
      {/* Profile form */}
      <form action={profileAction} className="space-y-6">
        {profileState?.status === 'success' && (
          <div role="status" aria-live="polite" className="rounded-md bg-success-50 border border-success-200 p-3 text-sm text-success-700">
            Changes saved.
          </div>
        )}
        {profileState?.status === 'error' && (
          <div role="alert" className="rounded-md bg-error-50 border border-error-200 p-3 text-sm text-error-700">
            {profileState.error}
          </div>
        )}

        {/* Basic Information */}
        <fieldset className="rounded-lg border border-neutral-200 bg-white p-6">
          <legend className="text-base font-semibold text-neutral-900 px-1">Basic Information</legend>
          <div className="space-y-4 mt-2">
            <Field label="Full name" name="full_name" required error={fieldError(profileState, 'full_name')}>
              <input id="full_name" name="full_name" type="text" required
                defaultValue={initialData.full_name} disabled={profilePending} className={inputCls} />
            </Field>

            {!isHospitalAdmin && (
              <Field label="Role" name="role" required error={fieldError(profileState, 'role')}>
                <select id="role" name="role" required defaultValue={initialData.role}
                  disabled={profilePending} className={inputCls}
                  onChange={(e) => setSelectedRole(e.target.value as AppRole)}>
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>{formatLabel(r)}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Phone" name="phone" error={fieldError(profileState, 'phone')}>
              <input id="phone" name="phone" type="tel" defaultValue={initialData.phone}
                disabled={profilePending} className={inputCls} />
            </Field>

            <Field label="Address" name="address" error={fieldError(profileState, 'address')}>
              <input id="address" name="address" type="text" defaultValue={initialData.address}
                disabled={profilePending} className={inputCls} />
            </Field>
          </div>
        </fieldset>

        {/* Professional Information */}
        {isClinicalRole && (
          <fieldset className="rounded-lg border border-neutral-200 bg-white p-6">
            <legend className="text-base font-semibold text-neutral-900 px-1">Professional Information</legend>
            <div className="space-y-4 mt-2">
              <Field label="Specialty / Specialization" name="specialty" error={fieldError(profileState, 'specialty')}>
                <input id="specialty" name="specialty" type="text" defaultValue={initialData.specialty}
                  disabled={profilePending} placeholder="e.g. Cardiology, Pediatrics" className={inputCls} />
              </Field>

              <Field label="Qualifications" name="qualifications" error={fieldError(profileState, 'qualifications')}>
                <input id="qualifications" name="qualifications" type="text" defaultValue={initialData.qualifications}
                  disabled={profilePending} placeholder="e.g. MBBS, MD (Internal Medicine)" className={inputCls} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="License number" name="license_number" error={fieldError(profileState, 'license_number')}>
                  <input id="license_number" name="license_number" type="text" defaultValue={initialData.license_number}
                    disabled={profilePending} className={inputCls} />
                </Field>

                <Field label="License expiry" name="license_expiry" error={fieldError(profileState, 'license_expiry')}>
                  <input id="license_expiry" name="license_expiry" type="date" defaultValue={initialData.license_expiry}
                    disabled={profilePending} className={inputCls} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Registration number" name="registration_number" error={fieldError(profileState, 'registration_number')}>
                  <input id="registration_number" name="registration_number" type="text" defaultValue={initialData.registration_number}
                    disabled={profilePending} className={inputCls} />
                </Field>

                <Field label="Years of experience" name="years_of_experience" error={fieldError(profileState, 'years_of_experience')}>
                  <input id="years_of_experience" name="years_of_experience" type="number" min="0" max="70"
                    defaultValue={initialData.years_of_experience ?? ''} disabled={profilePending} className={inputCls} />
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
              <Field label="Department" name="department_id" error={fieldError(profileState, 'department_id')}>
                <select id="department_id" name="department_id" defaultValue={initialData.department_id}
                  disabled={profilePending} className={inputCls}>
                  <option value="">No department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Employment type" name="employment_type" error={fieldError(profileState, 'employment_type')}>
                <select id="employment_type" name="employment_type" defaultValue={initialData.employment_type ?? ''}
                  disabled={profilePending} className={inputCls}>
                  <option value="">Select&hellip;</option>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{formatLabel(t)}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Hire date" name="hire_date" error={fieldError(profileState, 'hire_date')}>
              <input id="hire_date" name="hire_date" type="date" defaultValue={initialData.hire_date}
                disabled={profilePending} className={inputCls} />
            </Field>
          </div>
        </fieldset>

        {/* Emergency Contact */}
        <fieldset className="rounded-lg border border-neutral-200 bg-white p-6">
          <legend className="text-base font-semibold text-neutral-900 px-1">Emergency Contact</legend>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact name" name="emergency_contact_name" error={fieldError(profileState, 'emergency_contact_name')}>
                <input id="emergency_contact_name" name="emergency_contact_name" type="text"
                  defaultValue={initialData.emergency_contact_name} disabled={profilePending} className={inputCls} />
              </Field>

              <Field label="Contact phone" name="emergency_contact_phone" error={fieldError(profileState, 'emergency_contact_phone')}>
                <input id="emergency_contact_phone" name="emergency_contact_phone" type="tel"
                  defaultValue={initialData.emergency_contact_phone} disabled={profilePending} className={inputCls} />
              </Field>
            </div>
          </div>
        </fieldset>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={profilePending}
            className="rounded-md bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors min-h-[44px]">
            {profilePending ? 'Saving\u2026' : 'Save changes'}
          </button>
          <a href="/hospital/staff" className="inline-flex items-center min-h-[44px] px-3 text-sm text-neutral-600 hover:text-neutral-800">
            Cancel
          </a>
        </div>
      </form>

      {/* Danger zone card */}
      <div className="rounded-lg border border-error-200 bg-white p-6">
        <h2 className="text-base font-semibold text-error-700 mb-4">Danger zone</h2>

        {/* Status toggle */}
        <div className="flex items-start justify-between pb-6 border-b border-neutral-100">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Account status: <span className={`font-semibold ${isActive ? 'text-success-700' : 'text-neutral-500'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              {isActive ? 'Deactivating will immediately block login.' : 'Reactivating restores login access.'}
            </p>
            {statusState?.status === 'error' && (
              <p className="mt-1 text-xs text-error-600">{statusState.error}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={statusPending}
            className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 min-h-[44px] ${
              isActive
                ? 'border border-error-300 text-error-700 hover:bg-error-50'
                : 'border border-success-300 text-success-700 hover:bg-success-50'
            }`}
          >
            {statusPending ? 'Updating\u2026' : isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>

        {/* Password reset */}
        <div className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">Reset password</p>
              <p className="text-xs text-neutral-600 mt-1">
                Generates a new temporary password shown once.
              </p>
              {resetState?.status === 'error' && (
                <p className="mt-1 text-xs text-error-600">{resetState.error}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetPending}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 min-h-[44px]"
            >
              {resetPending ? 'Resetting\u2026' : 'Reset password'}
            </button>
          </div>

          {resetState?.status === 'success' && (
            <div className="mt-4 rounded-md border border-warning-200 bg-warning-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-warning-700 mb-2">
                Temporary password — shown once only
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-sm border border-warning-200 select-all">
                  {resetState.tempPassword}
                </code>
                <button
                  type="button"
                  onClick={async () => {
                    if (resetState.status !== 'success') return
                    await navigator.clipboard.writeText(resetState.tempPassword)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="rounded-md border border-warning-300 bg-white px-3 py-2 text-sm font-medium text-warning-700 hover:bg-warning-50 min-h-[44px]"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-xs text-warning-600">
                Share with {resetState.email}. This will not be shown again.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function fieldError(state: EditProfileState, field: string): string | undefined {
  if (state?.status === 'error' && state.fieldErrors) {
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
