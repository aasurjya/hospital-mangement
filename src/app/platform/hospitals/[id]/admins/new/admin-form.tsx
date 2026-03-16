'use client'

import { useActionState, useState } from 'react'
import { createHospitalAdminAction, type CreateAdminState } from './actions'

interface Props {
  hospitalId: string
  hospitalName: string
}

export function CreateAdminForm({ hospitalId, hospitalName }: Props) {
  const boundAction = createHospitalAdminAction.bind(null, hospitalId)
  const [state, formAction, isPending] = useActionState<CreateAdminState, FormData>(
    boundAction,
    { status: 'idle' }
  )
  const [copied, setCopied] = useState(false)

  if (state.status === 'success') {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-success-50 p-4 border border-success-200">
          <h3 className="text-sm font-semibold text-success-800">
            Hospital admin created successfully
          </h3>
          <p className="mt-1 text-sm text-success-700">
            Share the temporary password with <strong>{state.fullName}</strong> ({state.email}).
            They must change it on first login.
          </p>
        </div>

        <div className="rounded-md border border-warning-200 bg-warning-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-warning-700 mb-2">
            Temporary password — shown once only
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-sm border border-warning-200 select-all">
              {state.tempPassword}
            </code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(state.tempPassword)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="rounded-md border border-warning-300 bg-white px-3 py-2 text-sm font-medium text-warning-700 hover:bg-warning-50"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-xs text-warning-600">
            This password will not be shown again. Store it securely before leaving this page.
          </p>
        </div>

        <div className="flex gap-3">
          <a
            href={`/platform/hospitals/${hospitalId}/admins/new`}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Add another admin
          </a>
          <a
            href={`/platform/hospitals/${hospitalId}`}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back to hospital
          </a>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.status === 'error' && state.error && (
        <div role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200">
          {state.error}
        </div>
      )}

      <p className="text-sm text-neutral-500">
        Creating a hospital admin for <strong className="text-neutral-700">{hospitalName}</strong>.
        A temporary password will be generated and shown once.
      </p>

      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-neutral-700">
          Full name <span className="text-error-500">*</span>
        </label>
        <input
          id="full_name" name="full_name" type="text" required
          placeholder="Dr. Jane Smith"
          disabled={isPending}
          className={inputCls}
        />
        {state.status === 'error' && state.fieldErrors?.full_name?.[0] && (
          <p className="mt-1 text-xs text-error-600">{state.fieldErrors.full_name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
          Email address <span className="text-error-500">*</span>
        </label>
        <input
          id="email" name="email" type="email" required
          placeholder="admin@hospital.com"
          disabled={isPending}
          className={inputCls}
        />
        {state.status === 'error' && state.fieldErrors?.email?.[0] && (
          <p className="mt-1 text-xs text-error-600">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit" disabled={isPending}
          className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending ? 'Creating…' : 'Create admin account'}
        </button>
        <a href={`/platform/hospitals/${hospitalId}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          Cancel
        </a>
      </div>
    </form>
  )
}

const inputCls =
  'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'
