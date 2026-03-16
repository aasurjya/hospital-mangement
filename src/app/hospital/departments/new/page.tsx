'use client'

import { useActionState } from 'react'
import { createDepartmentAction, type DeptState } from '../actions'

export default function NewDepartmentPage() {
  const [state, formAction, isPending] = useActionState<DeptState, FormData>(
    createDepartmentAction, null
  )
  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="mb-6">
        <a href="/hospital/departments" className="text-sm text-neutral-500 hover:text-neutral-700">← Departments</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Add department</h1>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200">{state.error}</div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700">Name <span className="text-error-500">*</span></label>
            <input id="name" name="name" type="text" required disabled={isPending}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50" />
            {state?.fieldErrors?.name?.[0] && <p className="mt-1 text-xs text-error-600">{state.fieldErrors.name[0]}</p>}
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700">Description</label>
            <textarea id="description" name="description" rows={3} disabled={isPending}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending}
              className="rounded-md bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {isPending ? 'Creating…' : 'Create department'}
            </button>
            <a href="/hospital/departments" className="text-sm text-neutral-500 hover:text-neutral-700 py-2">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  )
}
