'use server'

import { revalidatePath } from 'next/cache'
import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { z } from 'zod'
import type { TriageLevel, OpdStatus } from '@/types/database'

/* ─── Schemas ─────────────────────────────────────────────────────────────── */

const checkInSchema = z.object({
  patient_id: z.string().uuid('Please select a patient.'),
  department_id: z.string().uuid().optional().or(z.literal('')),
  doctor_id: z.string().uuid().optional().or(z.literal('')),
  chief_complaint: z.string().min(1, 'Chief complaint is required.').max(500),
})

const triageSchema = z.object({
  queue_id: z.string().uuid(),
  triage_level: z.enum(['EMERGENCY', 'URGENT', 'SEMI_URGENT', 'NON_URGENT']),
})

const startConsultationSchema = z.object({
  queue_id: z.string().uuid(),
})

const completeConsultationSchema = z.object({
  queue_id: z.string().uuid(),
})

/* ─── State types ─────────────────────────────────────────────────────────── */

export type OpdActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/** Get next sequential token number for today (resets daily per hospital) */
async function getNextTokenNumber(hospitalId: string): Promise<number> {
  const supabase = createSupabaseServiceClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('opd_queue')
    .select('token_number')
    .eq('hospital_id', hospitalId)
    .gte('checked_in_at', todayStart.toISOString())
    .order('token_number', { ascending: false })
    .limit(1)
    .single()

  return (data?.token_number ?? 0) + 1
}

/* ─── Check In Patient ────────────────────────────────────────────────────── */

export async function checkInPatientAction(
  _prev: OpdActionState,
  formData: FormData
): Promise<OpdActionState> {
  const ctx = await requireRoles(['RECEPTIONIST', 'NURSE', 'HOSPITAL_ADMIN'])
  const hospitalId = ctx.profile.hospital_id!

  const parsed = checkInSchema.safeParse({
    patient_id: formData.get('patient_id'),
    department_id: (formData.get('department_id') as string) || undefined,
    doctor_id: (formData.get('doctor_id') as string) || undefined,
    chief_complaint: formData.get('chief_complaint'),
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

  const tokenNumber = await getNextTokenNumber(hospitalId)

  const { data: entry, error } = await supabase
    .from('opd_queue')
    .insert({
      hospital_id: hospitalId,
      patient_id: parsed.data.patient_id,
      department_id: parsed.data.department_id || null,
      doctor_id: parsed.data.doctor_id || null,
      token_number: tokenNumber,
      triage_level: 'NON_URGENT',
      status: 'WAITING',
      chief_complaint: parsed.data.chief_complaint,
      checked_in_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) return { error: 'Failed to check in patient. Please try again.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: parsed.data.patient_id,
    eventType: 'OPD_CHECK_IN',
    description: `Patient checked in to OPD with token #${tokenNumber}`,
    metadata: { entryId: entry.id, patient_id: parsed.data.patient_id, token_number: tokenNumber },
  })

  revalidatePath('/hospital/opd')
  return null
}

/* ─── Triage Patient ──────────────────────────────────────────────────────── */

export async function triagePatientAction(
  queueId: string,
  triageLevel: TriageLevel
): Promise<{ error?: string }> {
  const ctx = await requireRoles(['NURSE', 'DOCTOR', 'HOSPITAL_ADMIN'])
  const hospitalId = ctx.profile.hospital_id!

  const parsed = triageSchema.safeParse({ queue_id: queueId, triage_level: triageLevel })
  if (!parsed.success) return { error: 'Invalid input.' }

  const supabase = createSupabaseServiceClient()

  const { data: existing } = await supabase
    .from('opd_queue')
    .select('id, status, patient_id')
    .eq('id', queueId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!existing) return { error: 'Queue entry not found.' }
  if (existing.status === 'COMPLETED') return { error: 'Cannot triage a completed entry.' }

  const { error } = await supabase
    .from('opd_queue')
    .update({ triage_level: parsed.data.triage_level as TriageLevel })
    .eq('id', queueId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to update triage level.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: existing.patient_id,
    eventType: 'OPD_STATUS_UPDATED',
    description: `OPD patient triaged as ${triageLevel}`,
    metadata: { queueId, triage_level: triageLevel },
  })

  revalidatePath('/hospital/opd')
  return {}
}

/* ─── Start Consultation ──────────────────────────────────────────────────── */

export async function startConsultationAction(queueId: string): Promise<{ error?: string }> {
  const ctx = await requireRoles(['DOCTOR', 'HOSPITAL_ADMIN'])
  const hospitalId = ctx.profile.hospital_id!

  const parsed = startConsultationSchema.safeParse({ queue_id: queueId })
  if (!parsed.success) return { error: 'Invalid queue ID.' }

  const supabase = createSupabaseServiceClient()

  const { data: existing } = await supabase
    .from('opd_queue')
    .select('id, status, patient_id')
    .eq('id', queueId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!existing) return { error: 'Queue entry not found.' }
  if (existing.status !== 'WAITING') return { error: 'Patient is not in WAITING status.' }

  const { error } = await supabase
    .from('opd_queue')
    .update({
      status: 'IN_CONSULTATION' as OpdStatus,
      doctor_id: ctx.userId,
      consultation_started_at: new Date().toISOString(),
    })
    .eq('id', queueId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to start consultation.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: existing.patient_id,
    eventType: 'OPD_STATUS_UPDATED',
    description: `OPD consultation started for patient`,
    metadata: { queueId, status: 'IN_CONSULTATION' },
  })

  revalidatePath('/hospital/opd')
  return {}
}

/* ─── Complete Consultation ───────────────────────────────────────────────── */

export async function completeConsultationAction(queueId: string): Promise<{ error?: string }> {
  const ctx = await requireRoles(['DOCTOR', 'HOSPITAL_ADMIN'])
  const hospitalId = ctx.profile.hospital_id!

  const parsed = completeConsultationSchema.safeParse({ queue_id: queueId })
  if (!parsed.success) return { error: 'Invalid queue ID.' }

  const supabase = createSupabaseServiceClient()

  const { data: existing } = await supabase
    .from('opd_queue')
    .select('id, status, patient_id')
    .eq('id', queueId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!existing) return { error: 'Queue entry not found.' }
  if (existing.status !== 'IN_CONSULTATION') return { error: 'Consultation has not started yet.' }

  const { error } = await supabase
    .from('opd_queue')
    .update({
      status: 'COMPLETED' as OpdStatus,
      completed_at: new Date().toISOString(),
    })
    .eq('id', queueId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to complete consultation.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: existing.patient_id,
    eventType: 'OPD_STATUS_UPDATED',
    description: `OPD consultation completed`,
    metadata: { queueId, status: 'COMPLETED' },
  })

  revalidatePath('/hospital/opd')
  return {}
}
