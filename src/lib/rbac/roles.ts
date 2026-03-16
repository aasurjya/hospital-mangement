/**
 * Role-based access control utilities.
 * All role checks run server-side only. Never trust client-provided roles.
 */
import type { AppRole } from '@/types/database'

/** Roles that have cross-hospital (platform-level) access */
export const PLATFORM_ROLES: AppRole[] = ['PLATFORM_ADMIN']

/** Roles that manage a single hospital */
export const HOSPITAL_ADMIN_ROLES: AppRole[] = ['HOSPITAL_ADMIN']

/** Clinical roles with access to medical records */
export const CLINICAL_ROLES: AppRole[] = ['DOCTOR', 'NURSE']

/** All hospital staff roles (excludes PLATFORM_ADMIN and PATIENT) */
export const HOSPITAL_STAFF_ROLES: AppRole[] = [
  'HOSPITAL_ADMIN',
  'DOCTOR',
  'NURSE',
  'RECEPTIONIST',
  'LAB_TECHNICIAN',
  'PHARMACIST',
  'BILLING_STAFF',
  'ACCOUNTANT',
  'HR_MANAGER',
  'OPERATIONS_MANAGER',
]

export function isPlatformAdmin(role: AppRole): boolean {
  return role === 'PLATFORM_ADMIN'
}

export function isHospitalAdmin(role: AppRole): boolean {
  return role === 'HOSPITAL_ADMIN'
}

export function isClinicalRole(role: AppRole): boolean {
  return CLINICAL_ROLES.includes(role)
}

export function isHospitalStaff(role: AppRole): boolean {
  return HOSPITAL_STAFF_ROLES.includes(role)
}

export function canManageUsers(role: AppRole): boolean {
  return role === 'PLATFORM_ADMIN' || role === 'HOSPITAL_ADMIN'
}

export function canResetPasswords(role: AppRole): boolean {
  return role === 'PLATFORM_ADMIN' || role === 'HOSPITAL_ADMIN'
}

export function isPatient(role: AppRole): boolean {
  return role === 'PATIENT'
}
