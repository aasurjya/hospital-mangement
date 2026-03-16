'use client'

import { useActionState, useState } from 'react'
import {
  updateHospitalAdminAction,
  toggleHospitalAdminStatusAction,
  resetHospitalAdminPasswordAction,
  type EditProfileState,
  type ToggleStatusState,
  type ResetPasswordState,
} from '../../actions'

interface Props {
  hospitalId: string
  adminId: string
  initialData: { full_name: string; phone: string; is_active: boolean }
}

const inputCls =
  'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'

export function EditAdminForm({ hospitalId, adminId, initialData }: Props) {
  const [isActive, setIsActive] = useState(initialData.is_active)

  // 1. Profile update
  const boundUpdate = updateHospitalAdminAction.bind(null, hospitalId, adminId)
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
    const result = await toggleHospitalAdminStatusAction(hospitalId, adminId, !isActive)
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
    const result = await resetHospitalAdminPasswordAction(hospitalId, adminId)
    setResetState(result)
    setResetPending(false)
  }

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-4">Profile</h2>

        {profileState?.status === 'success' && (
          <div className="mb-4 rounded-md bg-success-50 border border-success-200 p-3 text-sm text-success-700">
            Changes saved.
          </div>
        )}
        {profileState?.status === 'error' && (
          <div role="alert" className="mb-4 rounded-md bg-error-50 border border-error-200 p-3 text-sm text-error-700">
            {profileState.error}
          </div>
        )}

        <form action={profileAction} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-neutral-700">
              Full name <span className="text-error-500">*</span>
            </label>
            <input
              id="full_name" name="full_name" type="text" required
              defaultValue={initialData.full_name}
              disabled={profilePending}
              className={inputCls}
            />
            {profileState?.status === 'error' && profileState.fieldErrors?.full_name?.[0] && (
              <p className="mt-1 text-xs text-error-600">{profileState.fieldErrors.full_name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-neutral-700">Phone</label>
            <input
              id="phone" name="phone" type="tel"
              defaultValue={initialData.phone}
              disabled={profilePending}
              className={inputCls}
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit" disabled={profilePending}
              className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {profilePending ? 'Saving…' : 'Save changes'}
            </button>
            <a href={`/platform/hospitals/${hospitalId}`} className="text-sm text-neutral-500 hover:text-neutral-700">
              Cancel
            </a>
          </div>
        </form>
      </div>

      {/* Danger zone card */}
      <div className="rounded-lg border border-error-200 bg-white p-6">
        <h2 className="text-base font-semibold text-error-700 mb-4">Danger zone</h2>

        {/* Status toggle */}
        <div className="flex items-start justify-between pb-5 border-b border-neutral-100">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Account status: <span className={`font-semibold ${isActive ? 'text-success-700' : 'text-neutral-500'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
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
            className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
              isActive
                ? 'border border-error-300 text-error-700 hover:bg-error-50'
                : 'border border-success-300 text-success-700 hover:bg-success-50'
            }`}
          >
            {statusPending ? 'Updating…' : isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>

        {/* Password reset */}
        <div className="pt-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">Reset password</p>
              <p className="text-xs text-neutral-500 mt-0.5">
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
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              {resetPending ? 'Resetting…' : 'Reset password'}
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
                  className="rounded-md border border-warning-300 bg-white px-3 py-2 text-sm font-medium text-warning-700 hover:bg-warning-50"
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
