'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { INVENTORY_MANAGEMENT_ROLES } from '@/lib/inventory/permissions'
import { z } from 'zod'
import type { InventoryTransactionType } from '@/types/database'

/* ─── Schemas ─────────────────────────────────────────────────────────────── */

const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required.').max(200),
  sku: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  quantity_on_hand: z.coerce.number().min(0, 'Quantity must be >= 0').default(0),
  reorder_level: z.coerce.number().min(0, 'Reorder level must be >= 0').default(10),
  cost_per_unit: z.coerce.number().min(0).optional(),
  expiry_date: z.string().optional().or(z.literal('')),
  location: z.string().max(200).optional(),
})

const recordTransactionSchema = z.object({
  item_id: z.string().uuid('Item is required.'),
  transaction_type: z.enum(['PURCHASE', 'DISPENSED', 'ADJUSTMENT', 'EXPIRED', 'RETURNED']),
  quantity: z.coerce.number().positive('Quantity must be > 0'),
  reference: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
})

/* ─── State types ─────────────────────────────────────────────────────────── */

export type InventoryActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null

/* ─── Create Inventory Item ───────────────────────────────────────────────── */

export async function createInventoryItemAction(
  _prev: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const ctx = await requireRoles(INVENTORY_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = createInventoryItemSchema.safeParse({
    name: formData.get('name'),
    sku: (formData.get('sku') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    quantity_on_hand: formData.get('quantity_on_hand') || '0',
    reorder_level: formData.get('reorder_level') || '10',
    cost_per_unit: (formData.get('cost_per_unit') as string) || undefined,
    expiry_date: (formData.get('expiry_date') as string) || undefined,
    location: (formData.get('location') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  const { data: item, error } = await supabase
    .from('inventory_items')
    .insert({
      hospital_id: hospitalId,
      name: parsed.data.name,
      sku: parsed.data.sku ?? null,
      category: parsed.data.category ?? null,
      quantity_on_hand: parsed.data.quantity_on_hand,
      reorder_level: parsed.data.reorder_level,
      cost_per_unit: parsed.data.cost_per_unit ?? null,
      expiry_date: parsed.data.expiry_date || null,
      location: parsed.data.location ?? null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'An item with this SKU already exists.' }
    return { error: 'Failed to create inventory item. Please try again.' }
  }

  // Auto-create low-stock alert if initial quantity is below reorder level
  if (parsed.data.quantity_on_hand <= parsed.data.reorder_level) {
    await supabase.from('inventory_alerts').insert({
      hospital_id: hospitalId,
      item_id: item.id,
      alert_type: 'LOW_STOCK',
    })
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'INVENTORY_ITEM_CREATED',
    description: `Inventory item "${parsed.data.name}" created`,
    metadata: {
      itemId: item.id,
      name: parsed.data.name,
      quantity_on_hand: parsed.data.quantity_on_hand,
      reorder_level: parsed.data.reorder_level,
    },
  })

  revalidatePath('/hospital/inventory')
  redirect('/hospital/inventory')
}

/* ─── Record Transaction ──────────────────────────────────────────────────── */

export async function recordTransactionAction(
  _prev: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const ctx = await requireRoles(INVENTORY_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = recordTransactionSchema.safeParse({
    item_id: formData.get('item_id'),
    transaction_type: formData.get('transaction_type'),
    quantity: formData.get('quantity'),
    reference: (formData.get('reference') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  // Verify item belongs to this hospital
  const { data: item } = await supabase
    .from('inventory_items')
    .select('id, name, quantity_on_hand, reorder_level')
    .eq('id', parsed.data.item_id)
    .eq('hospital_id', hospitalId)
    .single()

  if (!item) return { error: 'Inventory item not found.' }

  // Compute delta: PURCHASE/RETURNED increase stock; DISPENSED/EXPIRED/ADJUSTMENT decrease
  const INCREASE_TYPES: InventoryTransactionType[] = ['PURCHASE', 'RETURNED']
  const delta = (INCREASE_TYPES as string[]).includes(parsed.data.transaction_type)
    ? parsed.data.quantity
    : -parsed.data.quantity

  const newQuantity = item.quantity_on_hand + delta

  if (newQuantity < 0) {
    return { error: `Insufficient stock. Current quantity: ${item.quantity_on_hand}.` }
  }

  // Record the transaction and update quantity atomically
  const { error: txError } = await supabase.from('inventory_transactions').insert({
    hospital_id: hospitalId,
    item_id: parsed.data.item_id,
    transaction_type: parsed.data.transaction_type as InventoryTransactionType,
    quantity: parsed.data.quantity,
    reference: parsed.data.reference ?? null,
    notes: parsed.data.notes ?? null,
    performed_by: ctx.userId,
  })

  if (txError) return { error: 'Failed to record transaction.' }

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ quantity_on_hand: newQuantity })
    .eq('id', parsed.data.item_id)
    .eq('hospital_id', hospitalId)

  if (updateError) return { error: 'Failed to update stock quantity.' }

  // Raise low-stock alert if new quantity falls at or below reorder level
  if (newQuantity <= item.reorder_level && delta < 0) {
    const { data: existingAlert } = await supabase
      .from('inventory_alerts')
      .select('id')
      .eq('item_id', parsed.data.item_id)
      .eq('alert_type', 'LOW_STOCK')
      .eq('is_resolved', false)
      .single()

    if (!existingAlert) {
      await supabase.from('inventory_alerts').insert({
        hospital_id: hospitalId,
        item_id: parsed.data.item_id,
        alert_type: 'LOW_STOCK',
      })
    }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'INVENTORY_TRANSACTION',
    description: `${parsed.data.transaction_type} of ${parsed.data.quantity} unit(s) for "${item.name}"`,
    metadata: {
      itemId: parsed.data.item_id,
      transaction_type: parsed.data.transaction_type,
      quantity: parsed.data.quantity,
      new_quantity: newQuantity,
    },
  })

  revalidatePath('/hospital/inventory')
  return null
}

/* ─── Resolve Alert ───────────────────────────────────────────────────────── */

export async function resolveAlertAction(alertId: string): Promise<{ error?: string }> {
  const ctx = await requireRoles(INVENTORY_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const supabase = createSupabaseServiceClient()

  const { data: alert } = await supabase
    .from('inventory_alerts')
    .select('id, is_resolved, item_id')
    .eq('id', alertId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!alert) return { error: 'Alert not found.' }
  if (alert.is_resolved) return { error: 'Alert is already resolved.' }

  const { error } = await supabase
    .from('inventory_alerts')
    .update({
      is_resolved: true,
      resolved_by: ctx.userId,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to resolve alert.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'INVENTORY_TRANSACTION',
    description: `Inventory alert ${alertId} resolved`,
    metadata: { alertId, item_id: alert.item_id },
  })

  revalidatePath('/hospital/inventory')
  return {}
}
