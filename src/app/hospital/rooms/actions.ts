'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { ROOM_MANAGEMENT_ROLES } from '@/lib/rooms/permissions'
import { bulkRoomSchema, updateRoomSchema, bulkToggleSchema } from './schemas'
import type { RoomType } from '@/types/database'

export type RoomActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null

function generateRoomNumbers(prefix: string, startNum: number, quantity: number): string[] {
  const padWidth = Math.max(2, String(startNum + quantity - 1).length)
  return Array.from({ length: quantity }, (_, i) =>
    `${prefix}${String(startNum + i).padStart(padWidth, '0')}`
  )
}

async function findStartNum(hospitalId: string, prefix: string): Promise<number> {
  const supabase = createSupabaseServiceClient()
  const { data: existing } = await supabase
    .from('rooms')
    .select('room_number')
    .eq('hospital_id', hospitalId)
    .ilike('room_number', `${prefix}%`)

  if (!existing || existing.length === 0) return 1

  const nums = existing
    .map((r) => parseInt(r.room_number.slice(prefix.length), 10))
    .filter((n) => !isNaN(n))
  return nums.length > 0 ? Math.max(...nums) + 1 : 1
}

export async function previewRoomsAction(
  _prev: RoomActionState,
  formData: FormData
): Promise<RoomActionState & { rooms?: { room_number: string; room_type: string; floor: string | null }[] }> {
  const ctx = await requireRoles(ROOM_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = bulkRoomSchema.safeParse({
    room_type: formData.get('room_type'),
    floor: (formData.get('floor') as string) || undefined,
    prefix: formData.get('prefix'),
    quantity: formData.get('quantity'),
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { room_type, floor, prefix, quantity } = parsed.data
  const startNum = await findStartNum(hospitalId, prefix)
  const roomNumbers = generateRoomNumbers(prefix, startNum, quantity)

  return {
    rooms: roomNumbers.map((room_number) => ({
      room_number,
      room_type,
      floor: floor ?? null,
    })),
  }
}

export async function bulkCreateRoomsAction(
  _prev: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const ctx = await requireRoles(ROOM_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = bulkRoomSchema.safeParse({
    room_type: formData.get('room_type'),
    floor: (formData.get('floor') as string) || undefined,
    prefix: formData.get('prefix'),
    quantity: formData.get('quantity'),
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { room_type, floor, prefix, quantity, notes } = parsed.data
  const supabase = createSupabaseServiceClient()

  const startNum = await findStartNum(hospitalId, prefix)
  const roomNumbers = generateRoomNumbers(prefix, startNum, quantity)
  const rows = roomNumbers.map((room_number) => ({
    hospital_id: hospitalId,
    room_number,
    room_type: room_type as RoomType,
    floor: floor ?? null,
    notes: notes ?? null,
  }))

  const { data: created, error } = await supabase
    .from('rooms')
    .insert(rows)
    .select('id, room_number')

  if (error) {
    if (error.code === '23505') {
      return { error: 'One or more room numbers already exist. Try a different prefix or check existing rooms.' }
    }
    return { error: 'Failed to create rooms. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'ROOM_CREATED',
    description: `${quantity} room(s) created with prefix "${prefix}"`,
    metadata: {
      count: quantity,
      room_type,
      prefix,
      floor: floor ?? null,
      room_ids: created?.map((r) => r.id) ?? [],
      room_numbers: created?.map((r) => r.room_number) ?? [],
    },
  })

  revalidatePath('/hospital/rooms')
  redirect('/hospital/rooms')
}

export async function updateRoomAction(
  roomId: string,
  _prev: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const ctx = await requireRoles(ROOM_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = updateRoomSchema.safeParse({
    room_number: formData.get('room_number'),
    room_type: formData.get('room_type'),
    floor: (formData.get('floor') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
    is_available: formData.get('is_available'),
    is_active: formData.get('is_active'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { room_number, room_type, floor, notes, is_available, is_active } = parsed.data
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('rooms')
    .update({
      room_number,
      room_type: room_type as RoomType,
      floor: floor ?? null,
      notes: notes ?? null,
      is_available: is_available === 'on',
      is_active: is_active === 'on',
    })
    .eq('id', roomId)
    .eq('hospital_id', hospitalId)

  if (error) {
    if (error.code === '23505') {
      return { error: `Room number "${room_number}" already exists in this hospital.` }
    }
    return { error: 'Failed to update room. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'ROOM_UPDATED',
    description: `Room "${room_number}" updated`,
    metadata: { roomId, room_number, room_type, floor, is_available: is_available === 'on', is_active: is_active === 'on' },
  })

  revalidatePath('/hospital/rooms')
  redirect('/hospital/rooms')
}

export type BulkToggleState =
  | null
  | { status: 'success'; count: number }
  | { status: 'error'; error: string }

export async function bulkToggleAvailabilityAction(
  roomIds: string[],
  isAvailable: boolean
): Promise<BulkToggleState> {
  const ctx = await requireRoles(ROOM_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = bulkToggleSchema.safeParse({ room_ids: roomIds, is_available: isAvailable })
  if (!parsed.success) {
    return { status: 'error', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const supabase = createSupabaseServiceClient()

  const { count, error } = await supabase
    .from('rooms')
    .update({ is_available: isAvailable })
    .in('id', parsed.data.room_ids)
    .eq('hospital_id', hospitalId)

  if (error) {
    return { status: 'error', error: 'Failed to update rooms. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'ROOM_UPDATED',
    description: `${count ?? parsed.data.room_ids.length} room(s) marked ${isAvailable ? 'available' : 'unavailable'}`,
    metadata: { room_ids: parsed.data.room_ids, is_available: isAvailable },
  })

  revalidatePath('/hospital/rooms')
  return { status: 'success', count: count ?? parsed.data.room_ids.length }
}
