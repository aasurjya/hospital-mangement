'use client'

import { useState, useTransition } from 'react'
import { deleteDocumentAction } from './actions'

export function DeleteDocumentButton({ documentId, fileName }: { documentId: string; fileName: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteDocumentAction(documentId)
      if (result?.status === 'error') setError(result.error)
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-sm text-error-600 hover:text-error-800 disabled:opacity-50 min-h-[44px]"
      >
        {isPending ? 'Deleting\u2026' : 'Delete'}
      </button>
      {error && <p className="text-xs text-error-600">{error}</p>}
    </div>
  )
}
