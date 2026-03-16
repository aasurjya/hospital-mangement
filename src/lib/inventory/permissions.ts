import type { AppRole } from '@/types/database'

/** Roles that can create, edit, and manage inventory */
const INVENTORY_WRITE_ROLES: readonly AppRole[] = [
  'HOSPITAL_ADMIN',
  'OPERATIONS_MANAGER',
  'PHARMACIST',
]

/** All hospital staff roles (non-patient) can view inventory */
const INVENTORY_VIEW_EXCLUDED: readonly AppRole[] = ['PATIENT']

export function canManageInventory(role: AppRole): boolean {
  return (INVENTORY_WRITE_ROLES as readonly string[]).includes(role)
}

export function canViewInventory(role: AppRole): boolean {
  return !(INVENTORY_VIEW_EXCLUDED as readonly string[]).includes(role)
}

/** For use with requireRoles() in server actions */
export const INVENTORY_MANAGEMENT_ROLES: AppRole[] = [...INVENTORY_WRITE_ROLES]
