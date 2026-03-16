'use client'

import { useActionState, useRef, useState, useTransition } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { sendMessageAction } from '@/app/hospital/chat/actions'
import {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  MAX_ATTACHMENTS,
  CHAT_BUCKET,
} from '@/lib/chat/constants'
import type { MessageState } from '@/app/hospital/chat/actions'
import type { MessageRow } from '@/app/hospital/chat/[conversationId]/page'

interface AttachmentFile {
  file: File
  id: string
}

interface UploadedAttachment {
  storagePath: string
  fileName: string
  fileSize: number
  mimeType: string
}

interface Props {
  conversationId: string
  hospitalId: string
  currentUserId: string
  onMessageSent?: (tempMessage: MessageRow) => void
}

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function MessageInput({
  conversationId,
  hospitalId,
  currentUserId,
  onMessageSent,
}: Props) {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [sendState, formAction, isPending] = useActionState<MessageState, FormData>(
    sendMessageAction,
    null
  )
  const [, startTransition] = useTransition()

  const addFiles = (files: FileList | null) => {
    if (!files) return
    setFileError(null)

    const newFiles: AttachmentFile[] = []
    for (const file of Array.from(files)) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" has an unsupported file type.`)
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" exceeds the 10 MB limit.`)
        return
      }
      newFiles.push({ file, id: generateTempId() })
    }

    const combined = [...attachments, ...newFiles]
    if (combined.length > MAX_ATTACHMENTS) {
      setFileError(`You can attach at most ${MAX_ATTACHMENTS} files.`)
      return
    }

    setAttachments(combined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.closest('form')
      if (form) form.requestSubmit()
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const content = textRef.current?.value.trim() ?? ''
    if (!content && attachments.length === 0) return

    setIsUploading(true)
    setFileError(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const uploadedAttachments: UploadedAttachment[] = []

      for (const att of attachments) {
        const timestamp = Date.now()
        const safeName = att.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const storagePath = `${hospitalId}/${conversationId}/${timestamp}_${safeName}`

        const { error: uploadErr } = await supabase.storage
          .from(CHAT_BUCKET)
          .upload(storagePath, att.file, {
            contentType: att.file.type,
            upsert: false,
          })

        if (uploadErr) {
          setFileError(`Upload failed for "${att.file.name}": ${uploadErr.message}`)
          setIsUploading(false)
          return
        }

        uploadedAttachments.push({
          storagePath,
          fileName: att.file.name,
          fileSize: att.file.size,
          mimeType: att.file.type,
        })
      }

      const formData = new FormData()
      formData.set('conversation_id', conversationId)
      if (content) formData.set('content', content)
      if (uploadedAttachments.length > 0) {
        formData.set('attachment_paths', JSON.stringify(uploadedAttachments))
      }

      // Optimistically notify parent
      if (onMessageSent) {
        const tempMsg: MessageRow = {
          id: generateTempId(),
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: content || null,
          deleted_at: null,
          created_at: new Date().toISOString(),
          sender: null,
          attachments: uploadedAttachments.map((a, i) => ({
            id: `temp-att-${i}`,
            storage_path: a.storagePath,
            file_name: a.fileName,
            mime_type: a.mimeType,
            file_size: a.fileSize,
          })),
        }
        onMessageSent(tempMsg)
      }

      // Clear inputs before submitting
      if (textRef.current) textRef.current.value = ''
      setAttachments([])

      startTransition(() => {
        formAction(formData)
      })
    } finally {
      setIsUploading(false)
    }
  }

  const isBusy = isPending || isUploading

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs text-neutral-700"
            >
              <span className="max-w-[120px] truncate">{att.file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="-m-1 inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-neutral-400 hover:text-error-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 rounded"
                aria-label={`Remove ${att.file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {(fileError ?? sendState?.error) && (
        <p role="alert" aria-live="assertive" className="mb-2 text-xs text-error-600">{fileError ?? sendState?.error}</p>
      )}

      <div className="flex items-end gap-2">
        {/* File picker */}
        <div className="flex-none">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_MIME_TYPES.join(',')}
            className="hidden"
            id="chat-file-input"
            onChange={(e) => addFiles(e.target.files)}
            disabled={isBusy || attachments.length >= MAX_ATTACHMENTS}
          />
          <label
            htmlFor="chat-file-input"
            className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-neutral-300 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
              isBusy || attachments.length >= MAX_ATTACHMENTS
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            title="Attach file"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </label>
        </div>

        {/* Text area */}
        <textarea
          ref={textRef}
          name="content"
          rows={1}
          aria-label="Message"
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          onKeyDown={handleKeyDown}
          disabled={isBusy}
          className="flex-1 resize-none rounded-2xl border border-neutral-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 min-h-[44px] max-h-32"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={isBusy}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          aria-label="Send message"
        >
          {isBusy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg
              className="h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>
    </form>
  )
}
