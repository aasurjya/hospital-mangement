import type { AppRole } from '@/types/database'

/** Roles that can create, edit, and bulk-toggle rooms */
const ROOM_WRITE_ROLES: readonly AppRole[] = [
  'HOSPITAL_ADMIN',
  'OPERATIONS_MANAGER',
]

/** All hospital staff roles (non-patient) can view rooms */
const ROOM_VIEW_EXCLUDED: readonly AppRole[] = ['PATIENT']

export function canWriteRooms(role: AppRole): boolean {
  return (ROOM_WRITE_ROLES as readonly string[]).includes(role)
}

export function canViewRooms(role: AppRole): boolean {
  return !(ROOM_VIEW_EXCLUDED as readonly string[]).includes(role)
}

/** For use with requireRoles() in server actions */
export const ROOM_MANAGEMENT_ROLES: AppRole[] = [...ROOM_WRITE_ROLES]
