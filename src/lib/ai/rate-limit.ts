import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { AI_CONFIG } from './config'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
}

export async function checkAiRateLimit(
  hospitalId: string,
  doctorId: string
): Promise<RateLimitResult> {
  const supabase = createSupabaseServiceClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count, error } = await supabase
    .from('ai_suggestions')
    .select('id', { count: 'exact', head: true })
    .eq('hospital_id', hospitalId)
    .eq('doctor_id', doctorId)
    .gte('created_at', oneHourAgo)

  if (error) {
    // Fail closed on DB error
    return { allowed: false, remaining: 0 }
  }

  const used = count ?? 0
  const remaining = Math.max(0, AI_CONFIG.RATE_LIMIT_PER_HOUR - used)

  return {
    allowed: used < AI_CONFIG.RATE_LIMIT_PER_HOUR,
    remaining,
  }
}
