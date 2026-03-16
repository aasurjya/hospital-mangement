import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { canUseAiAssistant } from '@/lib/ai/permissions'
import { isAiConfigured } from '@/lib/ai/client'
import { card, alert } from '@/lib/styles'
import { AiDisclaimer } from './ai-disclaimer'
import { AiTabs } from './ai-tabs'

export const metadata = { title: 'AI Clinical Assistant' }

export default async function AiAssistantPage() {
  const { profile } = await requireAuth()

  if (!canUseAiAssistant(profile.role)) {
    redirect('/unauthorized')
  }

  const configured = isAiConfigured()

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-neutral-900 mb-6">AI Clinical Assistant</h1>

      {!configured ? (
        <div className={card.base}>
          <div className={alert.info}>
            <p className="font-semibold">AI features are not configured</p>
            <p className="mt-1">Contact your administrator to enable the AI Clinical Assistant by setting up the <code className="text-xs bg-primary-100 px-1 rounded">ANTHROPIC_API_KEY</code> environment variable.</p>
          </div>
        </div>
      ) : (
        <>
          <AiDisclaimer />
          <AiTabs />
        </>
      )}
    </div>
  )
}
