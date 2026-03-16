import type { AppRole } from '@/types/database'

/** Roles that can access the reports dashboard */
const REPORT_VIEW_ROLES: readonly AppRole[] = [
  'HOSPITAL_ADMIN',
  'OPERATIONS_MANAGER',
]

export function canViewReports(role: AppRole): boolean {
  return (REPORT_VIEW_ROLES as readonly string[]).includes(role)
}

/** For use with requireRoles() in guards */
export const REPORT_ACCESS_ROLES: AppRole[] = [...REPORT_VIEW_ROLES]
