'use server'

import { revalidatePath } from 'next/cache'
import { requireHospitalAdmin } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { z } from 'zod'
import type { NotificationChannel } from '@/types/database'

/**
 * Well-known event keys used across the system.
 * Hospital admins configure templates for these events.
 */
export const NOTIFICATION_EVENT_KEYS = [
  'appointment_reminder',
  'discharge_alert',
  'lab_results_ready',
  'prescription_ready',
] as const

export type NotificationEventKey = (typeof NOTIFICATION_EVENT_KEYS)[number]

const NOTIFICATION_CHANNELS: NotificationChannel[] = ['EMAIL', 'SMS']

const templateSchema = z.object({
  event_key: z.string().min(1, 'Event key is required.').max(100),
  channel: z.enum(['EMAIL', 'SMS'], { error: 'Channel is required.' }),
  subject: z.string().max(250).optional(),
  body_template: z.string().min(1, 'Body template is required.').max(5000),
  is_active: z.boolean().default(true),
})

export type NotificationTemplateActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  templateId?: string
} | null

export async function createNotificationTemplateAction(
  _prev: NotificationTemplateActionState,
  formData: FormData
): Promise<NotificationTemplateActionState> {
  const ctx = await requireHospitalAdmin()
  const hospitalId = ctx.profile.hospital_id!

  const parsed = templateSchema.safeParse({
    event_key: formData.get('event_key'),
    channel: formData.get('channel'),
    subject: (formData.get('subject') as string) || undefined,
    body_template: formData.get('body_template'),
    is_active: formData.get('is_active') !== 'false',
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  // Enforce one template per event_key + channel per hospital
  const { data: existing } = await supabase
    .from('notification_templates')
    .select('id')
    .eq('hospital_id', hospitalId)
    .eq('event_key', parsed.data.event_key)
    .eq('channel', parsed.data.channel)
    .single()

  if (existing) {
    return {
      error: `A ${parsed.data.channel} template for "${parsed.data.event_key}" already exists. Edit the existing template instead.`,
    }
  }

  const { data: template, error } = await supabase
    .from('notification_templates')
    .insert({
      hospital_id: hospitalId,
      event_key: parsed.data.event_key,
      channel: parsed.data.channel,
      subject: parsed.data.subject ?? null,
      body_template: parsed.data.body_template,
      is_active: parsed.data.is_active,
    })
    .select('id')
    .single()

  if (error) return { error: 'Failed to create notification template.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'NOTIFICATION_TEMPLATE_CREATED',
    description: `Notification template created: ${parsed.data.event_key} (${parsed.data.channel})`,
    metadata: { templateId: template.id, eventKey: parsed.data.event_key, channel: parsed.data.channel },
  })

  revalidatePath('/hospital/settings/notifications')
  return { templateId: template.id }
}

export async function updateNotificationTemplateAction(
  templateId: string,
  _prev: NotificationTemplateActionState,
  formData: FormData
): Promise<NotificationTemplateActionState> {
  const ctx = await requireHospitalAdmin()
  const hospitalId = ctx.profile.hospital_id!

  const parsed = templateSchema.safeParse({
    event_key: formData.get('event_key'),
    channel: formData.get('channel'),
    subject: (formData.get('subject') as string) || undefined,
    body_template: formData.get('body_template'),
    is_active: formData.get('is_active') !== 'false',
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  const { data: existing } = await supabase
    .from('notification_templates')
    .select('id')
    .eq('id', templateId)
    .eq('hospital_id', hospitalId)
    .single()

  if (!existing) return { error: 'Template not found.' }

  const { error } = await supabase
    .from('notification_templates')
    .update({
      event_key: parsed.data.event_key,
      channel: parsed.data.channel,
      subject: parsed.data.subject ?? null,
      body_template: parsed.data.body_template,
      is_active: parsed.data.is_active,
    })
    .eq('id', templateId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to update notification template.' }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'NOTIFICATION_TEMPLATE_UPDATED',
    description: `Notification template updated: ${parsed.data.event_key} (${parsed.data.channel})`,
    metadata: { templateId, eventKey: parsed.data.event_key, channel: parsed.data.channel },
  })

  revalidatePath('/hospital/settings/notifications')
  return { templateId }
}

export async function toggleNotificationTemplateAction(
  templateId: string,
  isActive: boolean
): Promise<NotificationTemplateActionState> {
  const ctx = await requireHospitalAdmin()
  const hospitalId = ctx.profile.hospital_id!

  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('notification_templates')
    .update({ is_active: isActive })
    .eq('id', templateId)
    .eq('hospital_id', hospitalId)

  if (error) return { error: 'Failed to update template status.' }

  revalidatePath('/hospital/settings/notifications')
  return { templateId }
}
