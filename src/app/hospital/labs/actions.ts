'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRoles } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { LAB_ORDER_ROLES, LAB_PROCESS_ROLES, LAB_CATALOGUE_ROLES } from '@/lib/labs/permissions'
import { labOrderSchema, labResultSchema, labCatalogueSchema } from '@/lib/labs/schemas'
import { generateLabOrderNumber } from '@/lib/labs/order-number'
import type { LabOrderPriority, LabOrderStatus } from '@/types/database'

export type LabActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null

export async function createLabOrderAction(
  _prev: LabActionState,
  formData: FormData
): Promise<LabActionState> {
  const ctx = await requireRoles(LAB_ORDER_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = labOrderSchema.safeParse({
    patient_id: formData.get('patient_id'),
    test_id: (formData.get('test_id') as string) || undefined,
    test_name: formData.get('test_name'),
    priority: formData.get('priority'),
    clinical_notes: (formData.get('clinical_notes') as string) || undefined,
    admission_id: (formData.get('admission_id') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()
  const orderNumber = generateLabOrderNumber()

  const { data: order, error } = await supabase
    .from('lab_orders')
    .insert({
      hospital_id: hospitalId,
      patient_id: parsed.data.patient_id,
      order_number: orderNumber,
      test_id: parsed.data.test_id || null,
      test_name: parsed.data.test_name,
      priority: parsed.data.priority as LabOrderPriority,
      clinical_notes: parsed.data.clinical_notes ?? null,
      ordered_by: ctx.userId,
      admission_id: parsed.data.admission_id || null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: 'Failed to create lab order. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'LAB_ORDER_CREATED',
    subjectId: parsed.data.patient_id,
    description: `Lab order ${orderNumber} created for "${parsed.data.test_name}"`,
    metadata: { orderId: order.id, orderNumber, test_name: parsed.data.test_name, priority: parsed.data.priority },
  })

  revalidatePath('/hospital/labs')
  redirect('/hospital/labs')
}

export async function updateLabOrderStatusAction(
  orderId: string,
  status: LabOrderStatus
): Promise<{ error?: string }> {
  const ctx = await requireRoles(LAB_PROCESS_ROLES)
  const hospitalId = ctx.profile.hospital_id!
  const supabase = createSupabaseServiceClient()

  const updates: Record<string, unknown> = { status }
  if (status === 'SAMPLE_COLLECTED') {
    updates.collected_by = ctx.userId
    updates.collected_at = new Date().toISOString()
  }
  if (status === 'COMPLETED') {
    updates.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('lab_orders')
    .update(updates)
    .eq('id', orderId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to update order.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'LAB_ORDER_UPDATED',
    description: `Lab order ${orderId} → ${status}`,
    metadata: { orderId, status },
  })

  revalidatePath('/hospital/labs')
  return {}
}

export async function enterLabResultAction(
  orderId: string,
  _prev: LabActionState,
  formData: FormData
): Promise<LabActionState> {
  const ctx = await requireRoles(LAB_PROCESS_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = labResultSchema.safeParse({
    result_value: formData.get('result_value'),
    unit: (formData.get('unit') as string) || undefined,
    normal_range: (formData.get('normal_range') as string) || undefined,
    is_abnormal: (formData.get('is_abnormal') as string) || undefined,
    interpretation: (formData.get('interpretation') as string) || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  const { error } = await supabase.from('lab_results').insert({
    hospital_id: hospitalId,
    lab_order_id: orderId,
    result_value: parsed.data.result_value,
    unit: parsed.data.unit ?? null,
    normal_range: parsed.data.normal_range ?? null,
    is_abnormal: parsed.data.is_abnormal === 'on',
    interpretation: parsed.data.interpretation ?? null,
    entered_by: ctx.userId,
  })

  if (error) {
    return { error: 'Failed to enter result.' }
  }

  // Update order status to COMPLETED
  await supabase
    .from('lab_orders')
    .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('hospital_id', hospitalId)

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'LAB_RESULT_ENTERED',
    description: `Lab result entered for order ${orderId}`,
    metadata: { orderId, is_abnormal: parsed.data.is_abnormal === 'on' },
  })

  revalidatePath(`/hospital/labs/${orderId}`)
  revalidatePath('/hospital/labs')
  return {}
}

export async function createLabCatalogueItemAction(
  _prev: LabActionState,
  formData: FormData
): Promise<LabActionState> {
  const ctx = await requireRoles(LAB_CATALOGUE_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const parsed = labCatalogueSchema.safeParse({
    test_name: formData.get('test_name'),
    test_code: (formData.get('test_code') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    sample_type: formData.get('sample_type'),
    normal_range: (formData.get('normal_range') as string) || undefined,
    unit: (formData.get('unit') as string) || undefined,
    turnaround_hours: (formData.get('turnaround_hours') as string) || '',
    price: (formData.get('price') as string) || '',
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()
  const d = parsed.data

  const { error } = await supabase.from('lab_test_catalogue').insert({
    hospital_id: hospitalId,
    test_name: d.test_name,
    test_code: d.test_code ?? null,
    category: d.category ?? null,
    sample_type: d.sample_type,
    normal_range: d.normal_range ?? null,
    unit: d.unit ?? null,
    turnaround_hours: typeof d.turnaround_hours === 'number' ? d.turnaround_hours : null,
    price: typeof d.price === 'number' ? d.price : null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Test code already exists.' }
    return { error: 'Failed to add test.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'LAB_CATALOGUE_CREATED',
    description: `Lab test "${d.test_name}" added to catalogue`,
    metadata: { test_name: d.test_name, test_code: d.test_code },
  })

  revalidatePath('/hospital/labs/catalogue')
  redirect('/hospital/labs/catalogue')
}
