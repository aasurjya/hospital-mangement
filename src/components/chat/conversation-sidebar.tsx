'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { ConversationRow } from '@/app/hospital/chat/page'

interface Props {
  initialConversations: ConversationRow[]
  currentUserId: string
  hospitalId: string
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return ''
  const now = Date.now()
  const ts = new Date(isoString).getTime()
  const diff = Math.floor((now - ts) / 1000)

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getConversationLabel(conv: ConversationRow): string {
  if (conv.name) return conv.name
  if (conv.type === 'DIRECT') return 'Direct Message'
  if (conv.type === 'BROADCAST') return 'Broadcast'
  return 'Group'
}

export function ConversationSidebar({ initialConversations, currentUserId, hospitalId }: Props) {
  const [conversations, setConversations] = useState<ConversationRow[]>(initialConversations)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    const channel = supabase
      .channel('conversation_members_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${currentUserId}`,
        },
        async () => {
          // Refetch conversations and unread counts when membership changes
          const [convResult, unreadResult] = await Promise.all([
            supabase
              .from('conversations')
              .select(`
                id,
                type,
                name,
                last_message_at,
                conversation_members!inner(user_id)
              `)
              .eq('hospital_id', hospitalId)
              .eq('conversation_members.user_id', currentUserId)
              .order('last_message_at', { ascending: false, nullsFirst: false })
              .limit(30),
            supabase.rpc('get_unread_counts', { p_user_id: currentUserId }),
          ])

          if (convResult.data) {
            const unreadMap = new Map<string, number>()
            for (const row of unreadResult.data ?? []) {
              unreadMap.set(row.conversation_id, Number(row.unread_count))
            }
            setConversations(
              convResult.data.map((c) => ({
                id: c.id,
                type: c.type,
                name: c.name,
                last_message_at: c.last_message_at,
                _unread: unreadMap.get(c.id) ?? 0,
              }))
            )
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUserId])

  return (
    <nav className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-xs text-neutral-500 mb-3">No conversations yet.</p>
          {/* [CRITICAL FIX] Empty state CTA — without this a new staff member has
              no visible path to start a conversation (dead end). */}
          <a
            href="/hospital/chat/new"
            className="inline-block rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Start a conversation
          </a>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {conversations.map((conv) => {
            const href = `/hospital/chat/${conv.id}`
            const isActive = pathname === href
            return (
              <li key={conv.id}>
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-[44px] items-start gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${
                    isActive ? 'bg-primary-50 border-r-2 border-primary-600' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-medium truncate ${
                          isActive ? 'text-primary-700' : 'text-neutral-900'
                        }`}
                      >
                        {getConversationLabel(conv)}
                      </span>
                      <span className="text-xs text-neutral-500 flex-none">
                        {formatRelativeTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-neutral-500 capitalize">
                        {conv.type.toLowerCase()}
                      </span>
                      {conv._unread > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-primary-600 px-2 py-1 text-xs font-medium text-white min-w-[16px]">
                          <span className="sr-only">unread messages: </span>
                          {conv._unread > 99 ? '99+' : conv._unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
