'use client'

import { useActionState } from 'react'
import { recordPaymentAction, type PaymentFormState } from '../actions'
import { formatLabel } from '@/lib/format'

const PAYMENT_METHODS = ['CASH', 'CHECK', 'BANK_TRANSFER', 'MOBILE_MONEY', 'INSURANCE', 'OTHER'] as const

interface Props {
  invoiceId: string
  balance: number
}

export function RecordPaymentForm({ invoiceId, balance }: Props) {
  const [state, formAction, isPending] = useActionState<PaymentFormState, FormData>(
    recordPaymentAction, null
  )

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="invoice_id" value={invoiceId} />

      {state?.error && (
        <div role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-neutral-700">
            Amount <span className="text-error-500" aria-hidden="true">*</span>
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={balance}
            defaultValue={balance.toFixed(2)}
            disabled={isPending}
            className={inputCls}
            required
          />
          {state?.fieldErrors?.amount?.[0] && (
            <p className="mt-1 text-xs text-error-600">{state.fieldErrors.amount[0]}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">Balance: {balance.toFixed(2)}</p>
        </div>

        <div>
          <label htmlFor="method" className="block text-sm font-medium text-neutral-700">
            Payment method <span className="text-error-500" aria-hidden="true">*</span>
          </label>
          <select id="method" name="method" disabled={isPending} className={inputCls} required>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{formatLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="reference" className="block text-sm font-medium text-neutral-700">
          Reference <span className="text-neutral-400 font-normal">(e.g. check number, transfer ID)</span>
        </label>
        <input id="reference" name="reference" type="text" disabled={isPending} className={inputCls} />
      </div>

      <div>
        <label htmlFor="pay_notes" className="block text-sm font-medium text-neutral-700">
          Notes <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <textarea id="pay_notes" name="notes" rows={2} disabled={isPending} className={inputCls} />
      </div>

      <button type="submit" disabled={isPending}
        className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-success-600 px-6 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-50 transition-colors">
        {isPending ? 'Recording...' : 'Record payment'}
      </button>
    </form>
  )
}

const inputCls = 'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'
