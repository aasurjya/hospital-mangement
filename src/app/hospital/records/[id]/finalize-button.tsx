'use client'

import { useTransition } from 'react'
import { finalizeRecordAction } from '../actions'

export function FinalizeButton({ recordId }: { recordId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(async () => { await finalizeRecordAction(recordId) })}
      className="rounded-md bg-success-600 px-4 py-2 text-sm font-medium text-white hover:bg-success-700 disabled:opacity-50"
    >
      {isPending ? 'Finalizing…' : 'Finalize record'}
    </button>
  )
}
