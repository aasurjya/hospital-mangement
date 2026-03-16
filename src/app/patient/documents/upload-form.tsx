'use client'

import { useActionState } from 'react'
import { uploadDocumentAction, type DocumentActionState } from './actions'
import { DOCUMENT_TYPE_OPTIONS, MAX_DOCUMENT_SIZE, ALLOWED_DOCUMENT_MIMES } from '@/lib/patient/constants'
import { btn, input, alert } from '@/lib/styles'

export function UploadDocumentForm() {
  const [state, formAction, isPending] = useActionState<DocumentActionState, FormData>(
    uploadDocumentAction, null
  )

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      <h2 className="text-base font-semibold text-neutral-900 mb-4">Upload Document</h2>

      {state?.status === 'success' && (
        <div role="status" aria-live="polite" className={`mb-4 ${alert.success}`}>Document uploaded successfully.</div>
      )}
      {state?.status === 'error' && (
        <div role="alert" className={`mb-4 ${alert.error}`}>{state.error}</div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="document_type" className={input.label}>Document Type</label>
            <select id="document_type" name="document_type" required disabled={isPending} className={input.base}>
              {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="file" className={input.label}>File</label>
            <input id="file" name="file" type="file" required disabled={isPending}
              accept={ALLOWED_DOCUMENT_MIMES.join(',')}
              className="mt-1 block w-full text-sm text-neutral-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100" />
            <p className="mt-1 text-xs text-neutral-500">PNG, JPEG, or PDF. Max {MAX_DOCUMENT_SIZE / (1024 * 1024)}MB.</p>
          </div>
        </div>
        <button type="submit" disabled={isPending} className={btn.primary}>
          {isPending ? 'Uploading\u2026' : 'Upload'}
        </button>
      </form>
    </div>
  )
}
