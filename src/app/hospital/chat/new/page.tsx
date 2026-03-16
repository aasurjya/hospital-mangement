import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { NewConversationForm } from '@/components/chat/new-conversation-form'

export const metadata = { title: 'New Conversation' }

export default async function NewConversationPage() {
  const { userId, profile } = await requireAuth()
  const hospitalId = profile.hospital_id
  if (!hospitalId) notFound()
  const isAdmin = profile.role === 'HOSPITAL_ADMIN'

  const service = createSupabaseServiceClient()

  // Fetch all active staff in the hospital (exclude PATIENT role and current user)
  const { data: staff } = await service
    .from('user_profiles')
    .select('id, full_name, role')
    .eq('hospital_id', hospitalId)
    .eq('is_active', true)
    .neq('role', 'PATIENT')
    .neq('id', userId)
    .order('full_name')

  return (
    <div className="flex h-full items-start justify-center overflow-y-auto p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-4">
          <a
            href="/hospital/chat"
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            ← Back
          </a>
          <h1 className="text-xl font-semibold text-neutral-900">New Conversation</h1>
        </div>
        <NewConversationForm
          staff={(staff ?? []).map((s) => ({
            id: s.id,
            full_name: s.full_name,
            role: s.role,
          }))}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
