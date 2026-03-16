'use server'

import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { isAiConfigured, generateAiResponse } from '@/lib/ai/client'
import { checkAiRateLimit } from '@/lib/ai/rate-limit'
import { AI_ASSISTANT_ROLES } from '@/lib/ai/permissions'
import { soapInputSchema, diagnosisInputSchema, drugInteractionInputSchema, patientSummaryInputSchema } from '@/lib/ai/schemas'
import { fetchPatientContext, formatPatientContextForPrompt } from '@/lib/ai/prompts/types'
import { buildSoapSystemPrompt } from '@/lib/ai/prompts/soap'
import { buildDiagnosisSystemPrompt } from '@/lib/ai/prompts/diagnosis'
import { buildDrugInteractionPrompt } from '@/lib/ai/prompts/drug-interactions'
import { buildPatientSummaryPrompt } from '@/lib/ai/prompts/patient-summary'
import type { AiSuggestionType } from '@/types/database'

export type AiActionState = {
  suggestionId?: string
  output?: string
  error?: string
  rateLimitRemaining?: number
} | null

async function runAiAction(
  doctorCtx: { userId: string; profile: { hospital_id: string | null; role: string } },
  suggestionType: AiSuggestionType,
  patientId: string | null,
  inputText: string,
  systemPrompt: string,
  userMessage: string
): Promise<AiActionState> {
  if (!isAiConfigured()) return { error: 'AI features are not configured. Contact your administrator.' }

  const hospitalId = doctorCtx.profile.hospital_id!
  const rateLimit = await checkAiRateLimit(hospitalId, doctorCtx.userId)
  if (!rateLimit.allowed) return { error: `Rate limit reached (${rateLimit.remaining} remaining). Try again later.`, rateLimitRemaining: 0 }

  try {
    const response = await generateAiResponse({ systemPrompt, userMessage })

    const supabase = createSupabaseServiceClient()
    const { data: suggestion, error: dbError } = await supabase
      .from('ai_suggestions')
      .insert({
        hospital_id: hospitalId,
        patient_id: patientId,
        doctor_id: doctorCtx.userId,
        suggestion_type: suggestionType,
        input_text: inputText,
        output_text: response.content,
        model_used: response.model,
        tokens_used: response.inputTokens + response.outputTokens,
        status: 'PENDING',
      })
      .select('id')
      .single()

    if (dbError) return { error: 'Failed to save AI suggestion.' }

    await writeAuditLog({
      hospitalId,
      actorId: doctorCtx.userId,
      actorRole: doctorCtx.profile.role as 'DOCTOR',
      subjectId: patientId,
      eventType: 'AI_SUGGESTION_CREATED',
      description: `AI ${suggestionType} generated`,
      metadata: { suggestionId: suggestion.id, suggestionType, tokensUsed: response.inputTokens + response.outputTokens },
    })

    return {
      suggestionId: suggestion.id,
      output: response.content,
      rateLimitRemaining: rateLimit.remaining - 1,
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'AI generation failed.' }
  }
}

export async function generateSoapNoteAction(
  _prev: AiActionState,
  formData: FormData
): Promise<AiActionState> {
  if (!isAiConfigured()) return { error: 'AI features are not configured.' }
  const ctx = await requireRoles(AI_ASSISTANT_ROLES)
  const parsed = soapInputSchema.safeParse({
    patient_id: formData.get('patient_id'),
    observations: formData.get('observations'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const patientCtx = await fetchPatientContext(parsed.data.patient_id, ctx.profile.hospital_id!)
  if (!patientCtx) return { error: 'Patient not found.' }

  const patientContextText = formatPatientContextForPrompt(patientCtx)
  return runAiAction(
    ctx, 'SOAP_NOTE', parsed.data.patient_id, parsed.data.observations,
    buildSoapSystemPrompt(),
    `<patient_context>\n${patientContextText}\n</patient_context>\n\n<doctor_input>\n${parsed.data.observations}\n</doctor_input>`
  )
}

export async function generateDiagnosisAction(
  _prev: AiActionState,
  formData: FormData
): Promise<AiActionState> {
  if (!isAiConfigured()) return { error: 'AI features are not configured.' }
  const ctx = await requireRoles(AI_ASSISTANT_ROLES)
  const parsed = diagnosisInputSchema.safeParse({
    patient_id: formData.get('patient_id'),
    symptoms: formData.get('symptoms'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const patientCtx = await fetchPatientContext(parsed.data.patient_id, ctx.profile.hospital_id!)
  if (!patientCtx) return { error: 'Patient not found.' }

  const patientContextText = formatPatientContextForPrompt(patientCtx)
  return runAiAction(
    ctx, 'DIFFERENTIAL_DIAGNOSIS', parsed.data.patient_id, parsed.data.symptoms,
    buildDiagnosisSystemPrompt(),
    `<patient_context>\n${patientContextText}\n</patient_context>\n\n<doctor_input>\n${parsed.data.symptoms}\n</doctor_input>`
  )
}

export async function generateDrugInteractionAction(
  _prev: AiActionState,
  formData: FormData
): Promise<AiActionState> {
  if (!isAiConfigured()) return { error: 'AI features are not configured.' }
  const ctx = await requireRoles(AI_ASSISTANT_ROLES)
  const medications = formData.getAll('medications').map(String).filter(Boolean)
  const patientId = (formData.get('patient_id') as string) || undefined

  const parsed = drugInteractionInputSchema.safeParse({
    patient_id: patientId,
    medications,
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const inputText = parsed.data.medications.join(', ')

  return runAiAction(
    ctx, 'DRUG_INTERACTION', parsed.data.patient_id ?? null, inputText,
    buildDrugInteractionPrompt(),
    `Check interactions for these medications:\n\n${parsed.data.medications.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
  )
}

export async function generatePatientSummaryAction(
  _prev: AiActionState,
  formData: FormData
): Promise<AiActionState> {
  if (!isAiConfigured()) return { error: 'AI features are not configured.' }
  const ctx = await requireRoles(AI_ASSISTANT_ROLES)
  const parsed = patientSummaryInputSchema.safeParse({
    patient_id: formData.get('patient_id'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const patientCtx = await fetchPatientContext(parsed.data.patient_id, ctx.profile.hospital_id!)
  if (!patientCtx) return { error: 'Patient not found.' }

  const contextText = formatPatientContextForPrompt(patientCtx)

  return runAiAction(
    ctx, 'PATIENT_SUMMARY', parsed.data.patient_id, 'Generate patient summary',
    buildPatientSummaryPrompt(),
    `Generate a clinical summary for this patient:\n\n${contextText}`
  )
}
