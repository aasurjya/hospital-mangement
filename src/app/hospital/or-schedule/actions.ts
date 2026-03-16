'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { z } from 'zod'
import type { OrCaseStatus, AnesthesiaType } from '@/types/database'

/* ─── Schemas ─────────────────────────────────────────────────────────────── */

const OR_CASE_ROLES = ['DOCTOR', 'HOSPITAL_ADMIN'] as const

const createOrCaseSchema = z.object({
  patient_id: z.string().uuid('Please select a patient.'),
  room_id: z.string().uuid().optional().or(z.literal('')),
  procedure_name: z.string().min(1, 'Procedure name is required.').max(300),
  procedure_code: z.string().max(50).optional(),
  scheduled_start: z.string().min(1, 'Scheduled start time is required.'),
  scheduled_end: z.string().min(1, 'Scheduled end time is required.'),
  anesthesia_type: z.enum(['GENERAL', 'LOCAL', 'REGIONAL', 'SPINAL', 'EPIDURAL', 'SEDATION', 'NONE']),
  pre_op_notes: z.string().max(2000).optional(),
})

const updateOrCaseStatusSchema = z.object({
  case_id: z.string().uuid(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  post_op_notes: z.string().max(2000).optional(),
})

/* ─── State types ─────────────────────────────────────────────────────────── */

export type OrCaseActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null

/* ─── Create OR Case ──────────────────────────────────────────────────────── */

export async function createOrCaseAction(
  _prev: OrCaseActionState,
  formData: FormData
): Promise<OrCaseActionState> {
  const ctx = await requireRoles([...OR_CASE_ROLES])
  const hospitalId = ctx.profile.hospital_id!

  const parsed = createOrCaseSchema.safeParse({
    patient_id: formData.get('patient_id'),
    room_id: (formData.get('room_id') as string) || undefined,
    procedure_name: formData.get('procedure_name'),
    procedure_code: (formData.get('procedure_code') as string) || undefined,
    scheduled_start: formData.get('scheduled_start'),
    scheduled_end: formData.get('scheduled_end'),
    anesthesia_type: formData.get('anesthesia_type'),
    pre_op_notes: (formData.get('pre_op_notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  // Verify patient belongs to this hospital
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', parsed.data.patient_id)
    .eq('hospital_id', hospitalId)
    .single()

  if (!patient) return { error: 'Patient not found in this hospital.' }

  // Verify room belongs to this hospital if provided
  if (parsed.data.room_id) {
    const { data: room } = await supabase
      .from('rooms')
      .select('id, room_type')
      .eq('id', parsed.data.room_id)
      .eq('hospital_id', hospitalId)
      .single()

    if (!room) return { error: 'Operating room not found in this hospital.' }
  }

  const { data: orCase, error } = await supabase
    .from('or_cases')
    .insert({
      hospital_id: hospitalId,
      patient_id: parsed.data.patient_id,
      room_id: parsed.data.room_id || null,
      primary_surgeon_id: ctx.userId,
      procedure_name: parsed.data.procedure_name,
      procedure_code: parsed.data.procedure_code ?? null,
      scheduled_start: parsed.data.scheduled_start,
      scheduled_end: parsed.data.scheduled_end,
      anesthesia_type: parsed.data.anesthesia_type as AnesthesiaType,
      pre_op_notes: parsed.data.pre_op_notes ?? null,
      status: 'SCHEDULED',
      created_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) return { error: 'Failed to schedule OR case. Please try again.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: parsed.data.patient_id,
    eventType: 'OR_CASE_CREATED',
    description: `OR case scheduled: "${parsed.data.procedure_name}"`,
    metadata: {
      caseId: orCase.id,
      patient_id: parsed.data.patient_id,
      procedure_name: parsed.data.procedure_name,
      scheduled_start: parsed.data.scheduled_start,
    },
  })

  revalidatePath('/hospital/or-schedule')
  redirect('/hospital/or-schedule')
}

/* ─── Update OR Case Status ───────────────────────────────────────────────── */

export async function updateOrCaseStatusAction(
  caseId: string,
  status: OrCaseStatus,
  postOpNotes?: string
): Promise<{ error?: string }> {
  const ctx = await requireRoles([...OR_CASE_ROLES])
  const hospitalId = ctx.profile.hospital_id!

  const parsed = updateOrCaseStatusSchema.safeParse({
    case_id: caseId,
    status,
    post_op_notes: postOpNotes,
  })
  if (!parsed.success) return { error: 'Invalid input.' }

  const supabase = createSupabaseServiceClient()

  const { data: existing } = await supabase
    .from('or_cases')
    .select('id, status, patient_id, procedure_name')
    .eq('id', caseId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!existing) return { error: 'OR case not found.' }
  if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
    return { error: `Cannot update a ${existing.status.toLowerCase()} case.` }
  }

  const updates: Record<string, unknown> = { status: parsed.data.status }
  if (parsed.data.status === 'IN_PROGRESS') {
    updates.actual_start = new Date().toISOString()
  }
  if (parsed.data.status === 'COMPLETED') {
    updates.actual_end = new Date().toISOString()
    if (parsed.data.post_op_notes) {
      updates.post_op_notes = parsed.data.post_op_notes
    }
  }

  const { error } = await supabase
    .from('or_cases')
    .update(updates)
    .eq('id', caseId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to update OR case status.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: existing.patient_id,
    eventType: 'OR_CASE_UPDATED',
    description: `OR case "${existing.procedure_name}" → ${parsed.data.status}`,
    metadata: { caseId, status: parsed.data.status },
  })

  revalidatePath('/hospital/or-schedule')
  return {}
}
