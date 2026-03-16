'use client'

import { useActionState, useEffect, useState } from 'react'
import { createHospitalAction, type CreateHospitalState } from './actions'
import { nameToSlug } from '@/lib/hospitals/schemas'

export function HospitalForm() {
  const [state, formAction, isPending] = useActionState<CreateHospitalState, FormData>(
    createHospitalAction,
    null
  )
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (!slugTouched) {
      setSlug(nameToSlug(name))
    }
  }, [name, slugTouched])

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200">
          {state.error}
        </div>
      )}

      <Field label="Hospital name" name="name" required error={state?.fieldErrors?.name?.[0]}>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="City General Hospital"
          disabled={isPending}
          className={inputCls}
        />
      </Field>

      <Field label="Slug" name="slug" hint="URL-safe identifier, auto-generated from name" error={state?.fieldErrors?.slug?.[0]}>
        <input
          id="slug"
          name="slug"
          type="text"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
          placeholder="city-general-hospital"
          disabled={isPending}
          className={inputCls}
        />
      </Field>

      <Field label="Address" name="address" error={state?.fieldErrors?.address?.[0]}>
        <input id="address" name="address" type="text" disabled={isPending} className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone" name="phone" error={state?.fieldErrors?.phone?.[0]}>
          <input id="phone" name="phone" type="tel" disabled={isPending} className={inputCls} />
        </Field>
        <Field label="Email" name="email" error={state?.fieldErrors?.email?.[0]}>
          <input id="email" name="email" type="email" disabled={isPending} className={inputCls} />
        </Field>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Creating…' : 'Create hospital'}
        </button>
        <a href="/platform/hospitals" className="text-sm text-neutral-500 hover:text-neutral-700">
          Cancel
        </a>
      </div>
    </form>
  )
}

const inputCls =
  'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'

function Field({
  label,
  name,
  hint,
  required,
  error,
  children,
}: {
  label: string
  name: string
  hint?: string
  required?: boolean
  error?: string
  children: React.ReactNode
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
