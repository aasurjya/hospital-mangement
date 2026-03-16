'use client'

import { useActionState } from 'react'
import { editHospitalAction, type EditHospitalState } from './actions'
import type { Database } from '@/types/database'

type Hospital = Database['public']['Tables']['hospitals']['Row']

export function EditHospitalForm({ hospital }: { hospital: Hospital }) {
  const boundAction = editHospitalAction.bind(null, hospital.id)
  const [state, formAction, isPending] = useActionState<EditHospitalState, FormData>(
    boundAction,
    null
  )

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200">
          {state.error}
        </div>
      )}

      <Field label="Hospital name" name="name" required error={state?.fieldErrors?.name?.[0]}>
        <input
          id="name" name="name" type="text" required
          defaultValue={hospital.name}
          disabled={isPending}
          className={inputCls}
        />
      </Field>

      <Field label="Slug" name="slug" required error={state?.fieldErrors?.slug?.[0]}>
        <input
          id="slug" name="slug" type="text" required
          defaultValue={hospital.slug}
          disabled={isPending}
          className={inputCls}
        />
      </Field>

      <Field label="Address" name="address" error={state?.fieldErrors?.address?.[0]}>
        <input id="address" name="address" type="text" defaultValue={hospital.address ?? ''} disabled={isPending} className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" name="phone" error={state?.fieldErrors?.phone?.[0]}>
          <input id="phone" name="phone" type="tel" defaultValue={hospital.phone ?? ''} disabled={isPending} className={inputCls} />
        </Field>
        <Field label="Email" name="email" error={state?.fieldErrors?.email?.[0]}>
          <input id="email" name="email" type="email" defaultValue={hospital.email ?? ''} disabled={isPending} className={inputCls} />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_active" name="is_active" type="checkbox"
          defaultChecked={hospital.is_active}
          value="true"
          disabled={isPending}
          className="h-4 w-4 rounded border-neutral-300 text-primary-600"
          onChange={(e) => {
            const hiddenInput = e.currentTarget.form?.querySelector('input[name="is_active"][type="hidden"]') as HTMLInputElement | null
            if (hiddenInput) hiddenInput.value = e.currentTarget.checked ? 'true' : 'false'
          }}
        />
        <label htmlFor="is_active" className="text-sm font-medium text-neutral-700">Active</label>
      </div>
      {/* Hidden field for checkbox false case */}
      <input type="hidden" name="is_active" value={hospital.is_active ? 'true' : 'false'} />

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={isPending}
          className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
        <a href={`/platform/hospitals/${hospital.id}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          Cancel
        </a>
      </div>
    </form>
  )
}

const inputCls =
  'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'

function Field({ label, name, required, hint, error, children }: {
  label: string; name: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-neutral-700">
        {label}{required && <span className="ml-0.5 text-error-500">*</span>}
      </label>
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
      {children}
      {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
    </div>
  )
}
