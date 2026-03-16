'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth, requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { SCHEDULE_MANAGEMENT_ROLES } from '@/lib/scheduling/permissions'
import { z } from 'zod'
import type { ShiftType, SwapRequestStatus } from '@/types/database'

/* ─── Schemas ─────────────────────────────────────────────────────────────── */

const createShiftSchema = z.object({
  staff_id: z.string().uuid('Please select a staff member.'),
  department_id: z.string().uuid().optional().or(z.literal('')),
  shift_type: z.enum(['MORNING', 'AFTERNOON', 'NIGHT', 'ON_CALL']),
  shift_date: z.string().min(1, 'Shift date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  notes: z.string().max(500).optional(),
})

const requestSwapSchema = z.object({
  requester_shift_id: z.string().uuid('Shift is required.'),
  target_staff_id: z.string().uuid('Target staff member is required.'),
  reason: z.string().max(500).optional(),
})

const reviewSwapSchema = z.object({
  swap_id: z.string().uuid(),
  status: z.enum(['APPROVED', 'REJECTED']),
})

/* ─── State types ─────────────────────────────────────────────────────────── */

export type ScheduleActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null

/* ─── Create Shift ────────────────────────────────────────────────────────── */

export async function createShiftAction(
  _prev: ScheduleActionState,
  formData: FormData
): Promise<ScheduleActionState> {
  const ctx = await requireRoles(SCHEDULE_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = createShiftSchema.safeParse({
    staff_id: formData.get('staff_id'),
    department_id: (formData.get('department_id') as string) || undefined,
    shift_type: formData.get('shift_type'),
    shift_date: formData.get('shift_date'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { staff_id, department_id, shift_type, shift_date, start_time, end_time, notes } = parsed.data

  const supabase = createSupabaseServiceClient()

  // Verify staff belongs to this hospital
  const { data: staff } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', staff_id)
    .eq('hospital_id', hospitalId)
    .single()

  if (!staff) return { error: 'Staff member not found in this hospital.' }

  const { data: shift, error } = await supabase
    .from('shift_schedules')
    .insert({
      hospital_id: hospitalId,
      staff_id,
      department_id: department_id || null,
      shift_type: shift_type as ShiftType,
      shift_date,
      start_time,
      end_time,
      notes: notes ?? null,
      created_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Failed to create shift. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: staff_id,
    eventType: 'SHIFT_CREATED',
    description: `${shift_type} shift created for staff ${staff_id} on ${shift_date}`,
    metadata: { shiftId: shift.id, staff_id, shift_type, shift_date, start_time, end_time },
  })

  revalidatePath('/hospital/scheduling')
  return null
}

/* ─── Delete Shift ────────────────────────────────────────────────────────── */

export async function deleteShiftAction(shiftId: string): Promise<{ error?: string }> {
  const ctx = await requireRoles(SCHEDULE_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const supabase = createSupabaseServiceClient()

  const { data: existing } = await supabase
    .from('shift_schedules')
    .select('id, staff_id, shift_type, shift_date')
    .eq('id', shiftId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!existing) return { error: 'Shift not found.' }

  const { error } = await supabase
    .from('shift_schedules')
    .delete()
    .eq('id', shiftId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to delete shift.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    subjectId: existing.staff_id,
    eventType: 'SHIFT_UPDATED',
    description: `Shift deleted: ${existing.shift_type} on ${existing.shift_date}`,
    metadata: { shiftId, shift_type: existing.shift_type, shift_date: existing.shift_date },
  })

  revalidatePath('/hospital/scheduling')
  return {}
}

/* ─── Request Swap ────────────────────────────────────────────────────────── */

export async function requestSwapAction(
  _prev: ScheduleActionState,
  formData: FormData
): Promise<ScheduleActionState> {
  const ctx = await requireAuth()
  const hospitalId = ctx.profile.hospital_id!

  const parsed = requestSwapSchema.safeParse({
    requester_shift_id: formData.get('requester_shift_id'),
    target_staff_id: formData.get('target_staff_id'),
    reason: (formData.get('reason') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  // Verify shift belongs to this hospital and requester owns it
  const { data: shift } = await supabase
    .from('shift_schedules')
    .select('id, staff_id')
    .eq('id', parsed.data.requester_shift_id)
    .eq('hospital_id', hospitalId)
    .eq('staff_id', ctx.userId)
    .single()

  if (!shift) return { error: 'Shift not found or you do not own this shift.' }

  // Verify target staff belongs to this hospital
  const { data: targetStaff } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', parsed.data.target_staff_id)
    .eq('hospital_id', hospitalId)
    .single()

  if (!targetStaff) return { error: 'Target staff member not found in this hospital.' }

  const { data: swapRequest, error } = await supabase
    .from('shift_swap_requests')
    .insert({
      hospital_id: hospitalId,
      requester_shift_id: parsed.data.requester_shift_id,
      target_staff_id: parsed.data.target_staff_id,
      reason: parsed.data.reason ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: 'Failed to submit swap request.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'SWAP_REQUESTED',
    description: `Swap request submitted for shift ${parsed.data.requester_shift_id}`,
    metadata: {
      swapId: swapRequest.id,
      requester_shift_id: parsed.data.requester_shift_id,
      target_staff_id: parsed.data.target_staff_id,
    },
  })

  revalidatePath('/hospital/scheduling')
  return null
}

/* ─── Review Swap ─────────────────────────────────────────────────────────── */

export async function reviewSwapAction(
  swapId: string,
  status: SwapRequestStatus
): Promise<{ error?: string }> {
  const ctx = await requireRoles(SCHEDULE_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = reviewSwapSchema.safeParse({ swap_id: swapId, status })
  if (!parsed.success) return { error: 'Invalid input.' }

  const supabase = createSupabaseServiceClient()

  const { data: existing } = await supabase
    .from('shift_swap_requests')
    .select('id, status')
    .eq('id', swapId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!existing) return { error: 'Swap request not found.' }
  if (existing.status !== 'PENDING') return { error: 'Swap request has already been reviewed.' }

  const { error } = await supabase
    .from('shift_swap_requests')
    .update({
      status: parsed.data.status as SwapRequestStatus,
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', swapId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to update swap request.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'SWAP_REVIEWED',
    description: `Swap request ${swapId} ${parsed.data.status.toLowerCase()}`,
    metadata: { swapId, status: parsed.data.status },
  })

  revalidatePath('/hospital/scheduling')
  return {}
}
