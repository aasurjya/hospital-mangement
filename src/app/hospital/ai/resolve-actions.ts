'use server'

import { revalidatePath } from 'next/cache'
import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { AI_ASSISTANT_ROLES } from '@/lib/ai/permissions'
import { resolveSuggestionSchema } from '@/lib/ai/schemas'
import type { AiSuggestionStatus } from '@/types/database'

export type ResolveState = { status: 'success' } | { status: 'error'; error: string } | null

const AUDIT_EVENTS: Record<string, 'AI_SUGGESTION_ACCEPTED' | 'AI_SUGGESTION_MODIFIED' | 'AI_SUGGESTION_REJECTED'> = {
  ACCEPTED: 'AI_SUGGESTION_ACCEPTED',
  MODIFIED: 'AI_SUGGESTION_MODIFIED',
  REJECTED: 'AI_SUGGESTION_REJECTED',
}

export async function resolveSuggestionAction(
  suggestionId: string,
  action: AiSuggestionStatus,
  modifiedText?: string
): Promise<ResolveState> {
  const ctx = await requireRoles(AI_ASSISTANT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = resolveSuggestionSchema.safeParse({
    suggestion_id: suggestionId,
    action,
    modified_text: modifiedText,
  })
  if (!parsed.success) return { status: 'error', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const supabase = createSupabaseServiceClient()

  // Fetch suggestion and verify ownership
  const { data: suggestion } = await supabase
    .from('ai_suggestions')
    .select('id, status, suggestion_type, patient_id, output_text, hospital_id')
    .eq('id', suggestionId)
    .eq('hospital_id', hospitalId)
    .eq('doctor_id', ctx.userId)
    .eq('status', 'PENDING')
    .single()

  if (!suggestion) return { status: 'error', error: 'Suggestion not found or already resolved.' }

  // Update suggestion status
  const { error: updateError } = await supabase
    .from('ai_suggestions')
    .update({
      status: action,
      resolved_at: new Date().toISOString(),
      resolved_by: ctx.userId,
      modified_text: action === 'MODIFIED' ? modifiedText : null,
    })
    .eq('id', suggestionId)

  if (updateError) return { status: 'error', error: 'Failed to update suggestion.' }

  // If accepting a SOAP note, create a DRAFT medical record
  if ((action === 'ACCEPTED' || action === 'MODIFIED') && suggestion.suggestion_type === 'SOAP_NOTE' && suggestion.patient_id) {
    const finalText = action === 'MODIFIED' ? modifiedText : suggestion.output_text
    const chiefComplaint = extractChiefComplaint(finalText ?? '')

    await supabase.from('medical_records').insert({
      hospital_id: hospitalId,
      patient_id: suggestion.patient_id,
      author_id: ctx.userId,
      visit_date: new Date().toISOString().slice(0, 10),
      chief_complaint: chiefComplaint,
      notes: finalText,
      status: 'DRAFT',
    })
  }

  const eventType = AUDIT_EVENTS[action]
  if (eventType) {
    await writeAuditLog({
      hospitalId,
      actorId: ctx.userId,
      actorRole: ctx.profile.role as 'DOCTOR',
      subjectId: suggestion.patient_id,
      eventType,
      description: `AI suggestion ${action.toLowerCase()}: ${suggestion.suggestion_type}`,
      metadata: { suggestionId, action, suggestionType: suggestion.suggestion_type },
    })
  }

  revalidatePath('/hospital/ai')
  return { status: 'success' }
}

/** Extract chief complaint from SOAP note (first line after "## Subjective") */
function extractChiefComplaint(soapText: string): string | null {
  const match = soapText.match(/##\s*Subjective\s*\n+(.+)/i)
  if (match) {
    const complaint = match[1].replace(/^[-*]\s*/, '').trim()
    return complaint.length > 0 ? complaint.slice(0, 500) : null
  }
  return null
}
