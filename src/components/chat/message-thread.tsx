'use client'

import { useEffect, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { MessageInput } from './message-input'
import { MessageBubble } from './message-bubble'
import { deleteMessageAction } from '@/app/hospital/chat/actions'
import type { MessageRow, MemberRow } from '@/app/hospital/chat/[conversationId]/page'

interface Props {
  conversationId: string
  hospitalId: string
  currentUserId: string
  currentUserRole: string
  initialMessages: MessageRow[]
  members: MemberRow[]
}

function buildMessageFromPayload(
  payload: Record<string, unknown>
): MessageRow {
  return {
    id: payload.id as string,
    conversation_id: payload.conversation_id as string,
    sender_id: payload.sender_id as string,
    content: (payload.content as string | null) ?? null,
    deleted_at: null,
    created_at: payload.created_at as string,
    sender: null,
    attachments: [],
  }
}

export function MessageThread({
  conversationId,
  hospitalId,
  currentUserId,
  currentUserRole,
  initialMessages,
  members,
}: Props) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const canDelete = currentUserRole === 'HOSPITAL_ADMIN'

  const isNearBottom = (): boolean => {
    const el = scrollRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100
  }

  const scrollToBottom = () => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  // Scroll to bottom on initial load
  useEffect(() => {
    scrollToBottom()
  }, [])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const shouldScroll = isNearBottom()
          const newMsg = buildMessageFromPayload(
            payload.new as Record<string, unknown>
          )
          setMessages((prev) => {
            // Skip if already present (exact ID match) OR if this is our own
            // optimistic message being confirmed — replace the temp entry by
            // sender_id + approximate timestamp instead of duplicating it.
            const alreadyExists = prev.some((m) => m.id === newMsg.id)
            if (alreadyExists) return prev
            if (newMsg.sender_id === currentUserId) {
              // Replace the optimistic temp-* entry for this sender if one exists
              const tempIdx = prev.findIndex(
                (m) =>
                  m.id.startsWith('temp-') &&
                  m.sender_id === currentUserId &&
                  Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 10000
              )
              if (tempIdx !== -1) {
                const updated = [...prev]
                updated[tempIdx] = newMsg
                return updated
              }
            }
            return [...prev, newMsg]
          })
          if (shouldScroll) {
            // Defer to allow DOM update
            setTimeout(scrollToBottom, 0)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>
          setMessages((prev) =>
            prev.map((m) =>
              m.id === (updated.id as string)
                ? { ...m, deleted_at: (updated.deleted_at as string | null) ?? null }
                : m
            )
          )
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId])

  // [HIGH FIX] Previously used `void action().then(optimisticUpdate)` which
  // silently swallowed any thrown error from the server action, leaving the
  // user with no feedback on failure.  Now errors are caught and displayed,
  // and the optimistic update only runs when the action resolves successfully.
  const handleDelete = (messageId: string) => {
    setDeleteError(null)
    deleteMessageAction(messageId).then(
      () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, deleted_at: new Date().toISOString() }
              : m
          )
        )
      },
      (err: unknown) => {
        const msg =
          err instanceof Error ? err.message : 'Failed to delete message.'
        setDeleteError(msg)
      }
    )
  }

  const handleMessageSent = (tempMessage: MessageRow) => {
    setMessages((prev) => [...prev, tempMessage])
    setTimeout(scrollToBottom, 0)
  }

  const memberMap = new Map(members.map((m) => [m.user_id, m]))

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {deleteError && (
        <div
          role="alert"
          className="mx-4 mt-2 rounded-md bg-error-50 px-3 py-2 text-xs text-error-700 border border-error-200"
        >
          {deleteError}
        </div>
      )}
      <div
        ref={scrollRef}
        role="log"
        aria-label="Messages"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-neutral-400 mt-8">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId
            const member = memberMap.get(msg.sender_id)
            const enrichedMsg: MessageRow = {
              ...msg,
              sender: msg.sender ?? (member ? { full_name: member.full_name } : null),
            }
            return (
              <MessageBubble
                key={msg.id}
                message={enrichedMsg}
                isOwn={isOwn}
                canDelete={isOwn || canDelete}
                onDelete={handleDelete}
              />
            )
          })
        )}
      </div>
      <div className="flex-none border-t border-neutral-200 bg-white">
        <MessageInput
          conversationId={conversationId}
          hospitalId={hospitalId}
          currentUserId={currentUserId}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  )
}
