import type { AppRole } from '@/types/database'

/** Only DOCTOR role can use the AI Clinical Assistant */
export function canUseAiAssistant(role: AppRole): boolean {
  return role === 'DOCTOR'
}

export const AI_ASSISTANT_ROLES: AppRole[] = ['DOCTOR']
