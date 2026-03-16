import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { markReadAction } from '../actions'
import { MessageThread } from '@/components/chat/message-thread'

export type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  deleted_at: string | null
  created_at: string
  sender: { full_name: string } | null
  attachments: {
    id: string
    storage_path: string
    file_name: string
    mime_type: string
    file_size: number
  }[]
}

export type MemberRow = {
  user_id: string
  full_name: string
  is_active: boolean
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const { userId, profile } = await requireAuth()
  const hospitalId = profile.hospital_id
  if (!hospitalId) notFound()

  const service = createSupabaseServiceClient()

  // Verify membership
  const { data: membership } = await service
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership) {
    notFound()
  }

  // Fetch conversation metadata
  const { data: conversation } = await service
    .from('conversations')
    .select('id, type, name, hospital_id')
    .eq('id', conversationId)
    .eq('hospital_id', hospitalId)
    .maybeSingle()

  if (!conversation) {
    notFound()
  }

  // Fetch initial messages (newest 50, then reverse to chronological)
  const { data: rawMessages } = await service
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      deleted_at,
      created_at,
      user_profiles!messages_sender_id_fkey(full_name),
      message_attachments(id, storage_path, file_name, mime_type, file_size)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(50)

  const messages: MessageRow[] = ((rawMessages ?? []) as unknown as Array<{
    id: string
    conversation_id: string
    sender_id: string
    content: string | null
    deleted_at: string | null
    created_at: string
    user_profiles: { full_name: string } | null
    message_attachments: {
      id: string
      storage_path: string
      file_name: string
      mime_type: string
      file_size: number
    }[]
  }>)
    .map((m) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      deleted_at: m.deleted_at,
      created_at: m.created_at,
      sender: m.user_profiles,
      attachments: m.message_attachments ?? [],
    }))
    .reverse()

  // Fetch members with profile info
  const { data: rawMembers } = await service
    .from('conversation_members')
    .select(`
      user_id,
      user_profiles!conversation_members_user_id_fkey(full_name, is_active)
    `)
    .eq('conversation_id', conversationId)

  const members: MemberRow[] = ((rawMembers ?? []) as unknown as Array<{
    user_id: string
    user_profiles: { full_name: string; is_active: boolean } | null
  }>).map((m) => ({
    user_id: m.user_id,
    full_name: m.user_profiles?.full_name ?? 'Unknown',
    is_active: m.user_profiles?.is_active ?? false,
  }))

  // Mark as read on page load (best-effort)
  await markReadAction(conversationId)

  const conversationName =
    conversation.name ??
    (conversation.type === 'DIRECT' ? 'Direct Message' : 'Group Chat')

  return (
    <div className="flex h-full flex-col">
      <header className="flex-none border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-semibold text-neutral-900">{conversationName}</h1>
            <p className="text-xs text-neutral-400 capitalize">{conversation.type.toLowerCase()}</p>
          </div>
        </div>
      </header>
      <MessageThread
        conversationId={conversationId}
        hospitalId={hospitalId}
        currentUserId={userId}
        currentUserRole={profile.role}
        initialMessages={messages}
        members={members}
      />
    </div>
  )
}
