'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { generateInvoiceNumber } from '@/lib/billing/invoice-number'
import { canCreateBilling, canWriteBilling, canVoidInvoice as canVoid } from '@/lib/billing/permissions'
import { z } from 'zod'

/* ─── Schemas ─────────────────────────────────────────────────────────────── */

const MAX_LINE_ITEMS = 100

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  quantity: z.coerce.number().positive('Quantity must be > 0'),
  unit_price: z.coerce.number().min(0, 'Price must be >= 0'),
})

const createInvoiceSchema = z.object({
  patient_id: z.string().uuid('Please select a patient.'),
  admission_id: z.string().uuid().optional().or(z.literal('')),
  appointment_id: z.string().uuid().optional().or(z.literal('')),
  due_date: z.string().optional().or(z.literal('')),
  tax_rate: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
  items_json: z.string().min(1, 'At least one line item is required'),
})

const paymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.coerce.number().positive('Amount must be > 0'),
  method: z.enum(['CASH', 'CHECK', 'BANK_TRANSFER', 'MOBILE_MONEY', 'INSURANCE', 'OTHER']),
  reference: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
})

/* ─── State types ─────────────────────────────────────────────────────────── */

export type InvoiceFormState = { error?: string; fieldErrors?: Record<string, string[]> } | null
export type PaymentFormState = { error?: string; fieldErrors?: Record<string, string[]> } | null

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function getHospitalId(profile: { hospital_id: string | null }): string | null {
  return profile.hospital_id
}

/* ─── Create Invoice ──────────────────────────────────────────────────────── */

export async function createInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData
): Promise<InvoiceFormState> {
  const ctx = await requireAuth()
  if (!canCreateBilling(ctx.profile.role)) {
    return { error: 'You do not have permission to create invoices.' }
  }

  const hospitalId = getHospitalId(ctx.profile)
  if (!hospitalId) return { error: 'No hospital context.' }

  const parsed = createInvoiceSchema.safeParse({
    patient_id: formData.get('patient_id'),
    admission_id: (formData.get('admission_id') as string) || undefined,
    appointment_id: (formData.get('appointment_id') as string) || undefined,
    due_date: (formData.get('due_date') as string) || undefined,
    tax_rate: formData.get('tax_rate') || 0,
    notes: (formData.get('notes') as string) || undefined,
    items_json: formData.get('items_json') as string,
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  // Parse and validate line items
  let items: z.infer<typeof lineItemSchema>[]
  try {
    const rawItems = JSON.parse(parsed.data.items_json)
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return { error: 'At least one line item is required.' }
    }
    if (rawItems.length > MAX_LINE_ITEMS) {
      return { error: `Too many line items (maximum ${MAX_LINE_ITEMS}).` }
    }
    const results = rawItems.map((item: unknown) => lineItemSchema.safeParse(item))
    const firstError = results.find((r) => !r.success)
    if (firstError && !firstError.success) {
      return { error: 'Invalid line item: ' + Object.values(firstError.error.flatten().fieldErrors).flat().join(', ') }
    }
    items = results.map((r) => (r as { success: true; data: z.infer<typeof lineItemSchema> }).data)
  } catch {
    return { error: 'Invalid line items data.' }
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

  // Verify optional admission belongs to this hospital
  if (parsed.data.admission_id) {
    const { data: admission } = await supabase
      .from('admissions')
      .select('id')
      .eq('id', parsed.data.admission_id)
      .eq('hospital_id', hospitalId)
      .single()
    if (!admission) return { error: 'Admission not found in this hospital.' }
  }

  // Verify optional appointment belongs to this hospital
  if (parsed.data.appointment_id) {
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id')
      .eq('id', parsed.data.appointment_id)
      .eq('hospital_id', hospitalId)
      .single()
    if (!appointment) return { error: 'Appointment not found in this hospital.' }
  }

  const taxRateDecimal = (parsed.data.tax_rate ?? 0) / 100
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxAmount = Math.round(subtotal * taxRateDecimal * 100) / 100
  const total = Math.round((subtotal + taxAmount) * 100) / 100

  // Retry invoice number generation on collision (unique constraint)
  let invoice: { id: string } | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error: invError } = await supabase
      .from('invoices')
      .insert({
        hospital_id: hospitalId,
        patient_id: parsed.data.patient_id,
        admission_id: parsed.data.admission_id || null,
        appointment_id: parsed.data.appointment_id || null,
        invoice_number: generateInvoiceNumber(),
        due_date: parsed.data.due_date || null,
        subtotal,
        tax_rate: taxRateDecimal,
        tax_amount: taxAmount,
        total,
        notes: parsed.data.notes ?? null,
        created_by: ctx.userId,
      })
      .select('id')
      .single()

    if (!invError && data) {
      invoice = data
      break
    }
    // Retry on unique constraint violation (invoice number collision)
    if (invError?.code === '23505' && attempt < 2) continue
    return { error: 'Failed to create invoice.' }
  }

  if (!invoice) return { error: 'Failed to create invoice.' }

  // Insert line items
  const itemRows = items.map((item, i) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total: Math.round(item.quantity * item.unit_price * 100) / 100,
    sort_order: i,
  }))

  const { error: itemsError } = await supabase.from('invoice_items').insert(itemRows)
  if (itemsError) {
    // Clean up orphan invoice
    await supabase.from('invoices').delete().eq('id', invoice.id)
    return { error: 'Failed to save line items.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'INVOICE_CREATED',
    description: `Invoice created for patient ${parsed.data.patient_id}`,
    metadata: { invoiceId: invoice.id, total },
  })

  revalidatePath('/hospital/billing')
  redirect(`/hospital/billing/${invoice.id}`)
}

/* ─── Issue Invoice ───────────────────────────────────────────────────────── */

export async function issueInvoiceAction(invoiceId: string): Promise<{ error?: string } | null> {
  const ctx = await requireAuth()
  if (!canWriteBilling(ctx.profile.role)) {
    return { error: 'You do not have permission to issue invoices.' }
  }

  const hospitalId = getHospitalId(ctx.profile)
  if (!hospitalId) return { error: 'No hospital context.' }

  const supabase = createSupabaseServiceClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', invoiceId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!invoice) return { error: 'Invoice not found.' }
  if (invoice.status !== 'DRAFT') return { error: 'Only draft invoices can be issued.' }

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'ISSUED', issued_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to issue invoice.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'INVOICE_ISSUED',
    description: `Invoice ${invoiceId} issued`,
    metadata: { invoiceId },
  })

  revalidatePath(`/hospital/billing/${invoiceId}`)
  revalidatePath('/hospital/billing')
  return null
}

/* ─── Void Invoice ────────────────────────────────────────────────────────── */

export async function voidInvoiceAction(invoiceId: string): Promise<{ error?: string } | null> {
  const ctx = await requireAuth()
  if (!canVoid(ctx.profile.role)) {
    return { error: 'You do not have permission to void invoices.' }
  }

  const hospitalId = getHospitalId(ctx.profile)
  if (!hospitalId) return { error: 'No hospital context.' }

  const supabase = createSupabaseServiceClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', invoiceId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!invoice) return { error: 'Invoice not found.' }
  if (invoice.status === 'VOID') return { error: 'Invoice is already void.' }
  if (invoice.status === 'PAID') return { error: 'Cannot void a fully paid invoice.' }
  if (invoice.status === 'PARTIAL') return { error: 'Cannot void an invoice with recorded payments. Refund first.' }

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'VOID' })
    .eq('id', invoiceId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to void invoice.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'INVOICE_VOIDED',
    description: `Invoice ${invoiceId} voided`,
    metadata: { invoiceId },
  })

  revalidatePath(`/hospital/billing/${invoiceId}`)
  revalidatePath('/hospital/billing')
  return null
}

/* ─── Record Payment ──────────────────────────────────────────────────────── */

export async function recordPaymentAction(
  _prev: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const ctx = await requireAuth()
  if (!canCreateBilling(ctx.profile.role)) {
    return { error: 'You do not have permission to record payments.' }
  }

  const hospitalId = getHospitalId(ctx.profile)
  if (!hospitalId) return { error: 'No hospital context.' }

  const parsed = paymentSchema.safeParse({
    invoice_id: formData.get('invoice_id'),
    amount: formData.get('amount'),
    method: formData.get('method'),
    reference: (formData.get('reference') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  // Atomic payment recording via Postgres RPC (row-level locking prevents race conditions)
  const { data: result, error: rpcError } = await supabase.rpc('record_payment', {
    p_invoice_id: parsed.data.invoice_id,
    p_hospital_id: hospitalId,
    p_amount: parsed.data.amount,
    p_method: parsed.data.method,
    p_reference: parsed.data.reference ?? null,
    p_notes: parsed.data.notes ?? null,
    p_recorded_by: ctx.userId,
  })

  if (rpcError) return { error: 'Failed to record payment. Please try again.' }

  const rpcResult = result as { error?: string; payment_id?: string } | null
  if (rpcResult?.error) return { error: rpcResult.error }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'PAYMENT_RECORDED',
    description: `Payment of ${parsed.data.amount} recorded for invoice ${parsed.data.invoice_id}`,
    metadata: { invoiceId: parsed.data.invoice_id, amount: parsed.data.amount, method: parsed.data.method },
  })

  revalidatePath(`/hospital/billing/${parsed.data.invoice_id}`)
  revalidatePath('/hospital/billing')
  return null
}
