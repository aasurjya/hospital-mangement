import type { AppRole } from '@/types/database'

/** Only HOSPITAL_ADMIN can manage notification templates */
export const NOTIFICATION_MANAGEMENT_ROLES: readonly AppRole[] = [
  'HOSPITAL_ADMIN',
]

export function canManageNotifications(role: AppRole): boolean {
  return (NOTIFICATION_MANAGEMENT_ROLES as readonly string[]).includes(role)
}
