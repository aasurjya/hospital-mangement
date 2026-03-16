import { z } from 'zod'
import { AI_CONFIG } from './config'
import type { AiSuggestionStatus } from '@/types/database'

const RESOLVE_ACTIONS: AiSuggestionStatus[] = ['ACCEPTED', 'MODIFIED', 'REJECTED']

export const soapInputSchema = z.object({
  patient_id: z.string().uuid('Select a patient'),
  observations: z.string().min(10, 'Enter at least 10 characters').max(AI_CONFIG.MAX_INPUT_LENGTH),
})

export const diagnosisInputSchema = z.object({
  patient_id: z.string().uuid('Select a patient'),
  symptoms: z.string().min(10, 'Enter at least 10 characters').max(AI_CONFIG.MAX_INPUT_LENGTH),
})

export const drugInteractionInputSchema = z.object({
  patient_id: z.string().uuid().optional(),
  medications: z.array(z.string().min(1).max(200))
    .min(2, 'At least 2 medications required')
    .max(AI_CONFIG.MAX_MEDICATIONS_COUNT, `Maximum ${AI_CONFIG.MAX_MEDICATIONS_COUNT} medications`),
})

export const patientSummaryInputSchema = z.object({
  patient_id: z.string().uuid('Select a patient'),
})

export const resolveSuggestionSchema = z.object({
  suggestion_id: z.string().uuid(),
  action: z.enum(RESOLVE_ACTIONS as [AiSuggestionStatus, ...AiSuggestionStatus[]]),
  modified_text: z.string().max(20000).optional(),
}).refine(
  (data) => data.action !== 'MODIFIED' || (data.modified_text && data.modified_text.length > 0),
  { message: 'Modified text is required when modifying a suggestion', path: ['modified_text'] }
)
