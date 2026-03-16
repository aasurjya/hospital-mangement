import { redirect } from 'next/navigation'
import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { card } from '@/lib/styles'
import Link from 'next/link'

export const metadata = { title: 'Chat' }

export default async function PatientChatPage() {
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  // Get patient's conversations
  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', ctx.userId)

  const conversationIds = (memberships ?? []).map((m) => m.conversation_id)

  let conversations: { id: string; name: string | null; type: string; last_message_at: string | null }[] = []
  if (conversationIds.length > 0) {
    const { data } = await supabase
      .from('conversations')
      .select('id, name, type, last_message_at')
      .in('id', conversationIds)
      .eq('hospital_id', hospitalId)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    conversations = data ?? []
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Chat</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-sm text-neutral-600">No conversations yet.</p>
          <p className="mt-2 text-xs text-neutral-500">Your care team will start a conversation with you, or ask them to set one up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/patient/chat/${conv.id}`}
              className={`${card.base} block hover:border-primary-300 transition-colors`}
            >
              <p className="text-sm font-medium text-neutral-900">
                {conv.name ?? 'Direct Message'}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {conv.last_message_at
                  ? `Last message: ${new Date(conv.last_message_at).toLocaleDateString()}`
                  : 'No messages yet'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
