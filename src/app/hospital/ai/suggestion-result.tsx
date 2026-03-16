'use client'

import { useState, useTransition } from 'react'
import { resolveSuggestionAction } from './resolve-actions'
import { btn, alert, card } from '@/lib/styles'
import type { AiSuggestionStatus } from '@/types/database'

interface Props {
  suggestionId: string
  output: string
}

export function SuggestionResult({ suggestionId, output }: Props) {
  const [status, setStatus] = useState<AiSuggestionStatus | null>(null)
  const [editing, setEditing] = useState(false)
  const [editedText, setEditedText] = useState(output)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleResolve(action: AiSuggestionStatus, text?: string) {
    if (action === 'REJECTED' && !confirm('Reject this suggestion?')) return

    startTransition(async () => {
      const result = await resolveSuggestionAction(suggestionId, action, text)
      if (result?.status === 'error') {
        setError(result.error)
      } else {
        setStatus(action)
        setEditing(false)
      }
    })
  }

  const resolved = status !== null

  return (
    <div className="mt-4">
      <div className={`${card.base} border-l-4 border-l-secondary-400 bg-secondary-50/30`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-700">
            AI Generated
          </span>
          {resolved && (
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              status === 'ACCEPTED' ? 'bg-success-100 text-success-700' :
              status === 'MODIFIED' ? 'bg-primary-100 text-primary-700' :
              'bg-neutral-100 text-neutral-600'
            }`}>
              {status === 'ACCEPTED' ? 'Accepted' : status === 'MODIFIED' ? 'Modified & Accepted' : 'Rejected'}
            </span>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleResolve('MODIFIED', editedText)}
                disabled={isPending}
                className={btn.primary}
              >
                {isPending ? 'Saving\u2026' : 'Accept Modified'}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setEditedText(output) }}
                className="text-sm text-neutral-600 hover:text-neutral-800"
              >
                Cancel Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-neutral-800 whitespace-pre-wrap">
            {resolved && status === 'MODIFIED' ? editedText : output}
          </div>
        )}

        {error && <div role="alert" className={`mt-3 ${alert.error}`}>{error}</div>}

        {!resolved && !editing && (
          <div className="mt-4 flex gap-2 border-t border-neutral-100 pt-3">
            <button
              type="button"
              onClick={() => handleResolve('ACCEPTED')}
              disabled={isPending}
              className={btn.success}
            >
              {isPending ? 'Accepting\u2026' : 'Accept'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={isPending}
              className={btn.primary}
            >
              Modify
            </button>
            <button
              type="button"
              onClick={() => handleResolve('REJECTED')}
              disabled={isPending}
              className={btn.danger}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
