'use client'

import { useState, useTransition } from 'react'
import { getAttachmentUrlAction } from '@/app/hospital/chat/actions'
import type { MessageRow } from '@/app/hospital/chat/[conversationId]/page'

interface Props {
  message: MessageRow
  isOwn: boolean
  canDelete: boolean
  onDelete?: (id: string) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AttachmentLink({
  attachment,
}: {
  attachment: MessageRow['attachments'][number]
}) {
  const [isPending, startTransition] = useTransition()
  // [CRITICAL FIX] Surface download failures instead of silently doing nothing.
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownload = () => {
    setDownloadError(null)
    startTransition(async () => {
      const url = await getAttachmentUrlAction(attachment.storage_path)
      if (url) {
        const a = document.createElement('a')
        a.href = url
        a.download = attachment.file_name
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        setDownloadError('Could not download file. Please try again.')
      }
    })
  }

  const isImage = attachment.mime_type.startsWith('image/')

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isPending}
        aria-label={`Download ${attachment.file_name}`}
        className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs hover:bg-neutral-50 disabled:opacity-50 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        <span className="text-lg" aria-hidden="true">
          {isImage ? '🖼' : '📄'}
        </span>
        <span className="flex flex-col items-start">
          <span className="font-medium text-neutral-700 truncate max-w-[160px]">
            {attachment.file_name}
          </span>
          <span className="text-neutral-500">{formatBytes(attachment.file_size)}</span>
        </span>
        {isPending ? (
          <span
            className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent"
            aria-label="Downloading"
          />
        ) : (
          <svg
            className="h-3 w-3 text-primary-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
        )}
      </button>
      {downloadError && (
        <p role="alert" className="text-xs text-error-600 px-1">
          {downloadError}
        </p>
      )}
    </div>
  )
}

export function MessageBubble({ message, isOwn, canDelete, onDelete }: Props) {
  const [isDeletePending, startDeleteTransition] = useTransition()

  if (message.deleted_at) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
        <span className="text-xs italic text-neutral-400 px-2">
          This message was deleted
        </span>
      </div>
    )
  }

  // [CRITICAL FIX] Require explicit confirmation before deleting a message.
  // A single misclick previously caused an immediate irreversible soft-delete.
  const handleDelete = () => {
    if (!onDelete) return
    const confirmed = window.confirm('Delete this message? This cannot be undone.')
    if (!confirmed) return
    startDeleteTransition(() => {
      onDelete(message.id)
    })
  }

  return (
    <div
      className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 mb-1 group`}
    >
      <div
        className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
      >
        {/* Sender name */}
        {!isOwn && (
          <span className="mb-1 px-1 text-xs font-medium text-neutral-600">
            {message.sender?.full_name ?? 'Unknown'}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-3 py-2 text-sm ${
            isOwn
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
          }`}
        >
          {message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Attachments */}
          {message.attachments.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {message.attachments.map((att) => (
                <AttachmentLink key={att.id} attachment={att} />
              ))}
            </div>
          )}
        </div>

        {/* Timestamp + delete */}
        <div
          className={`mt-1 flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <span className="text-xs text-neutral-500 px-1">
            {formatTime(message.created_at)}
          </span>
          {canDelete && onDelete && (
            // opacity-0 keeps the button in the accessibility tree (keyboard focusable)
            // group-hover:opacity-100 reveals it on pointer hover
            // focus:opacity-100 reveals it on keyboard focus
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeletePending}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-xs text-error-400 hover:text-error-600 disabled:opacity-50 transition-opacity rounded px-1"
              aria-label="Delete message"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
