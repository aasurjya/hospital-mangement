import type { AppRole } from '@/types/database'

/** Roles that can create, edit, and delete shift schedules */
const SCHEDULE_WRITE_ROLES: readonly AppRole[] = [
  'HOSPITAL_ADMIN',
  'HR_MANAGER',
]

/** Roles excluded from viewing schedules (patients and platform admins have no need) */
const SCHEDULE_VIEW_EXCLUDED: readonly AppRole[] = ['PATIENT']

export function canManageSchedule(role: AppRole): boolean {
  return (SCHEDULE_WRITE_ROLES as readonly string[]).includes(role)
}

export function canViewSchedule(role: AppRole): boolean {
  return !(SCHEDULE_VIEW_EXCLUDED as readonly string[]).includes(role)
}

/** For use with requireRoles() in server actions */
export const SCHEDULE_MANAGEMENT_ROLES: AppRole[] = [...SCHEDULE_WRITE_ROLES]
