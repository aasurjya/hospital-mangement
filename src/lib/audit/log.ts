/**
 * Audit logging utilities.
 * All audit logs are written server-side using the service role client.
 * Never call these from Client Components.
 */
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { AppRole, AuditEventType, Json } from '@/types/database'

interface AuditLogParams {
  hospitalId: string | null
  actorId: string
  actorRole: AppRole
  subjectId?: string | null
  eventType: AuditEventType
  description: string
  metadata?: Json
}

/**
 * Write an audit log entry. Safe to call from any server action.
 * Errors are caught and logged to stderr — never surface audit failures to users.
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient()

    const { error } = await supabase.from('audit_logs').insert({
      hospital_id: params.hospitalId,
      actor_id: params.actorId,
      actor_role: params.actorRole,
      subject_id: params.subjectId ?? null,
      event_type: params.eventType,
      description: params.description,
      metadata: params.metadata ?? {},
    })

    if (error) {
      console.error('[audit] Failed to write audit log:', error.message, params)
    }
  } catch (err) {
    console.error('[audit] Unexpected error writing audit log:', err, params)
  }
}
