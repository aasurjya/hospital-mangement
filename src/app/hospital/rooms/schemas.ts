import { z } from 'zod'
import { ROOM_TYPES } from './constants'

export const bulkRoomSchema = z.object({
  room_type: z.enum(ROOM_TYPES as [string, ...string[]]),
  floor: z.string().max(20).optional(),
  prefix: z.string().min(1, 'Prefix is required').max(20),
  quantity: z.coerce.number().int().min(1, 'Minimum 1 room').max(50, 'Maximum 50 rooms'),
  notes: z.string().max(500).optional(),
})

export const updateRoomSchema = z.object({
  room_number: z.string().min(1, 'Room number is required').max(50),
  room_type: z.enum(ROOM_TYPES as [string, ...string[]]),
  floor: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  is_available: z.string().optional(),
  is_active: z.string().optional(),
})

export const bulkToggleSchema = z.object({
  room_ids: z.array(z.string().uuid()).min(1, 'Select at least one room').max(50, 'Maximum 50 rooms at once'),
  is_available: z.boolean(),
})
