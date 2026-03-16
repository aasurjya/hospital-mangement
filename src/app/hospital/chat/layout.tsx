import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServiceClient, createSupabaseServerClient } from '@/lib/supabase/server'
import { ConversationSidebar } from '@/components/chat/conversation-sidebar'
import type { ConversationRow } from './page'

export const metadata = { title: 'Chat' }

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, profile } = await requireAuth()

  // [HIGH FIX] PLATFORM_ADMIN has hospital_id === null.  The previous code
  // used profile.hospital_id! which throws a runtime error for platform admins.
  // The chat feature is hospital-scoped, so platform admins must select a
  // hospital context before using it.  For now, redirect them away gracefully.
  const hospitalId = profile.hospital_id
  if (!hospitalId) {
    redirect('/hospital')
  }

  const service = createSupabaseServiceClient()

  const { data: rawConversations } = await service
    .from('conversations')
    .select(`
      id,
      type,
      name,
      last_message_at,
      conversation_members!inner(user_id)
    `)
    .eq('hospital_id', hospitalId)
    .eq('conversation_members.user_id', userId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(30)

  // CRITICAL FIX: must use the user-scoped server client here, NOT service-role.
  // get_unread_counts is SECURITY DEFINER and uses auth.uid() internally.
  // The service-role client has no JWT context, so auth.uid() returns null
  // and the function returns zero rows, causing all unread badges to be 0.
  const userClient = await createSupabaseServerClient()
  const { data: unreadData } = await userClient.rpc('get_unread_counts', {
    p_user_id: userId,
  })

  const unreadMap = new Map<string, number>()
  for (const row of unreadData ?? []) {
    unreadMap.set(row.conversation_id, row.unread_count)
  }

  const conversations: ConversationRow[] = (rawConversations ?? []).map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    last_message_at: c.last_message_at,
    _unread: unreadMap.get(c.id) ?? 0,
  }))

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white">
      <aside aria-label="Conversations" className="w-72 flex-none border-r border-neutral-200 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-sm font-semibold text-neutral-700">Conversations</h2>
          <a
            href="/hospital/chat/new"
            aria-label="New conversation"
            title="New conversation"
            className="flex min-h-[44px] min-w-[44px] items-center gap-1 rounded-md bg-primary-600 px-3 py-1 text-xs font-medium text-white hover:bg-primary-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New
          </a>
        </div>
        <ConversationSidebar
          initialConversations={conversations}
          currentUserId={userId}
          hospitalId={hospitalId}
        />
      </aside>
      <main aria-label="Chat messages" className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
