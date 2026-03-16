'use client'

import { useState, useTransition } from 'react'
import { issueInvoiceAction, voidInvoiceAction } from '../actions'

interface Props {
  invoiceId: string
  invoiceNumber: string
  showIssue: boolean
  showVoid: boolean
}

export function InvoiceActions({ invoiceId, invoiceNumber, showIssue, showVoid }: Props) {
  const [isIssuePending, startIssue] = useTransition()
  const [isVoidPending, startVoid] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {error && (
        <div role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        {showIssue && (
          <button
            disabled={isIssuePending}
            aria-busy={isIssuePending}
            onClick={() => {
              if (!confirm(`Issue invoice ${invoiceNumber}? This will mark it as ready for payment.`)) return
              setError(null)
              startIssue(async () => {
                const result = await issueInvoiceAction(invoiceId)
                if (result?.error) setError(result.error)
              })
            }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-600 px-5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {isIssuePending ? 'Issuing...' : 'Issue invoice'}
          </button>
        )}
        {showVoid && (
          <button
            disabled={isVoidPending}
            aria-busy={isVoidPending}
            onClick={() => {
              if (!confirm(`Void invoice ${invoiceNumber}? This cannot be undone.`)) return
              setError(null)
              startVoid(async () => {
                const result = await voidInvoiceAction(invoiceId)
                if (result?.error) setError(result.error)
              })
            }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-error-300 px-5 text-sm font-medium text-error-700 hover:bg-error-50 disabled:opacity-50 transition-colors"
          >
            {isVoidPending ? 'Voiding...' : 'Void invoice'}
          </button>
        )}
      </div>
    </div>
  )
}
