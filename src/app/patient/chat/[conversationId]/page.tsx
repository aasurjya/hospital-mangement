import { notFound } from 'next/navigation'
import { requirePatient } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { card } from '@/lib/styles'

export const metadata = { title: 'Chat' }

export default async function PatientChatThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = await params
  const ctx = await requirePatient()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  // Verify membership
  const { data: membership } = await supabase
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', ctx.userId)
    .single()

  if (!membership) notFound()

  // Get conversation info
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, name, type')
    .eq('id', conversationId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!conv) notFound()

  // Get messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, created_at, sender_id, user_profiles!messages_sender_id_fkey(full_name)')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(100)

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <a href="/patient/chat" className="text-sm text-neutral-500 hover:text-neutral-700">&larr; Chat</a>
        <h1 className="mt-2 text-xl font-semibold text-neutral-900">{conv.name ?? 'Direct Message'}</h1>
      </div>

      <div className="space-y-3 mb-6">
        {(!messages || messages.length === 0) ? (
          <p className="text-sm text-neutral-500 text-center py-8">No messages yet.</p>
        ) : (
          messages.map((msg) => {
            const sender = msg.user_profiles as { full_name: string } | null
            const isOwn = msg.sender_id === ctx.userId
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  isOwn ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-900'
                }`}>
                  {!isOwn && (
                    <p className="text-xs font-medium mb-1 opacity-70">{sender?.full_name ?? 'Unknown'}</p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-primary-200' : 'text-neutral-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs text-neutral-500 text-center">
        To send a message, use the hospital chat system. Real-time messaging for patient portal is coming soon.
      </p>
    </div>
  )
}
