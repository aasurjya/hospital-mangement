'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { z } from 'zod'

const DISCHARGE_SUMMARY_WRITE_ROLES = [
  'HOSPITAL_ADMIN',
  'DOCTOR',
  'NURSE',
] as const

const summarySchema = z.object({
  admission_diagnosis: z.string().max(1000).optional(),
  discharge_diagnosis: z.string().max(1000).optional(),
  summary_of_stay: z.string().max(5000).optional(),
  procedures: z.string().max(2000).optional(),
  follow_up_instructions: z.string().max(2000).optional(),
  follow_up_date: z.string().optional(),
})

export type DischargeSummaryActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  summaryId?: string
} | null

export async function createDischargeSummaryAction(
  admissionId: string,
  _prev: DischargeSummaryActionState,
  formData: FormData
): Promise<DischargeSummaryActionState> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id!

  if (!(DISCHARGE_SUMMARY_WRITE_ROLES as readonly string[]).includes(ctx.profile.role)) {
    return { error: 'You do not have permission to create discharge summaries.' }
  }

  const parsed = summarySchema.safeParse({
    admission_diagnosis: (formData.get('admission_diagnosis') as string) || undefined,
    discharge_diagnosis: (formData.get('discharge_diagnosis') as string) || undefined,
    summary_of_stay: (formData.get('summary_of_stay') as string) || undefined,
    procedures: (formData.get('procedures') as string) || undefined,
    follow_up_instructions: (formData.get('follow_up_instructions') as string) || undefined,
    follow_up_date: (formData.get('follow_up_date') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  // Verify admission belongs to this hospital
  const { data: admission } = await supabase
    .from('admissions')
    .select('id, patient_id')
    .eq('id', admissionId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!admission) return { error: 'Admission not found.' }

  // Check no summary already exists
  const { data: existing } = await supabase
    .from('discharge_summaries')
    .select('id')
    .eq('admission_id', admissionId)
    .single()

  if (existing) return { error: 'A discharge summary already exists for this admission.' }

  const { data: summary, error } = await supabase
    .from('discharge_summaries')
    .insert({
      hospital_id: hospitalId,
      admission_id: admissionId,
      patient_id: admission.patient_id,
      admission_diagnosis: parsed.data.admission_diagnosis ?? null,
      discharge_diagnosis: parsed.data.discharge_diagnosis ?? null,
      summary_of_stay: parsed.data.summary_of_stay ?? null,
      procedures: parsed.data.procedures ?? null,
      follow_up_instructions: parsed.data.follow_up_instructions ?? null,
      follow_up_date: parsed.data.follow_up_date || null,
      status: 'DRAFT',
      created_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) return { error: 'Failed to create discharge summary.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: admission.patient_id,
    eventType: 'DISCHARGE_SUMMARY_CREATED',
    description: `Discharge summary created for admission ${admissionId}`,
    metadata: { summaryId: summary.id, admissionId },
  })

  revalidatePath(`/hospital/admissions/${admissionId}/discharge-summary`)
  return { summaryId: summary.id }
}

export async function updateDischargeSummaryAction(
  summaryId: string,
  admissionId: string,
  _prev: DischargeSummaryActionState,
  formData: FormData
): Promise<DischargeSummaryActionState> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id!

  if (!(DISCHARGE_SUMMARY_WRITE_ROLES as readonly string[]).includes(ctx.profile.role)) {
    return { error: 'You do not have permission to edit discharge summaries.' }
  }

  const parsed = summarySchema.safeParse({
    admission_diagnosis: (formData.get('admission_diagnosis') as string) || undefined,
    discharge_diagnosis: (formData.get('discharge_diagnosis') as string) || undefined,
    summary_of_stay: (formData.get('summary_of_stay') as string) || undefined,
    procedures: (formData.get('procedures') as string) || undefined,
    follow_up_instructions: (formData.get('follow_up_instructions') as string) || undefined,
    follow_up_date: (formData.get('follow_up_date') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  // Verify summary belongs to this hospital and is still DRAFT
  const { data: existing } = await supabase
    .from('discharge_summaries')
    .select('id, status, patient_id')
    .eq('id', summaryId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!existing) return { error: 'Discharge summary not found.' }
  if (existing.status === 'FINALIZED') return { error: 'Finalized summaries cannot be edited.' }

  const { error } = await supabase
    .from('discharge_summaries')
    .update({
      admission_diagnosis: parsed.data.admission_diagnosis ?? null,
      discharge_diagnosis: parsed.data.discharge_diagnosis ?? null,
      summary_of_stay: parsed.data.summary_of_stay ?? null,
      procedures: parsed.data.procedures ?? null,
      follow_up_instructions: parsed.data.follow_up_instructions ?? null,
      follow_up_date: parsed.data.follow_up_date || null,
    })
    .eq('id', summaryId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to update discharge summary.' }

  revalidatePath(`/hospital/admissions/${admissionId}/discharge-summary`)
  return { summaryId }
}

export async function finalizeDischargeSummaryAction(
  summaryId: string,
  admissionId: string,
  _prev: DischargeSummaryActionState,
  _formData: FormData
): Promise<DischargeSummaryActionState> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id!

  if (!(DISCHARGE_SUMMARY_WRITE_ROLES as readonly string[]).includes(ctx.profile.role)) {
    return { error: 'You do not have permission to finalize discharge summaries.' }
  }

  const supabase = createSupabaseServiceClient()

  const { data: existing } = await supabase
    .from('discharge_summaries')
    .select('id, status, patient_id')
    .eq('id', summaryId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!existing) return { error: 'Discharge summary not found.' }
  if (existing.status === 'FINALIZED') return { error: 'This summary is already finalized.' }

  const { error } = await supabase
    .from('discharge_summaries')
    .update({
      status: 'FINALIZED',
      finalized_by: ctx.userId,
      finalized_at: new Date().toISOString(),
    })
    .eq('id', summaryId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to finalize discharge summary.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: existing.patient_id,
    eventType: 'DISCHARGE_SUMMARY_FINALIZED',
    description: `Discharge summary finalized for admission ${admissionId}`,
    metadata: { summaryId, admissionId },
  })

  revalidatePath(`/hospital/admissions/${admissionId}/discharge-summary`)
  return { summaryId }
}
