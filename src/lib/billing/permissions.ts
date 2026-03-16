import type { AppRole } from '@/types/database'

/** Roles that can create/edit invoices and record payments */
const BILLING_WRITE_ROLES: readonly AppRole[] = [
  'HOSPITAL_ADMIN',
  'BILLING_STAFF',
]

/** Roles that can create invoices and record payments (but not edit/void) */
const BILLING_CREATE_ROLES: readonly AppRole[] = [
  'RECEPTIONIST',
]

/** Roles that have read-only access to billing */
const BILLING_VIEW_ROLES: readonly AppRole[] = [
  'DOCTOR',
  'NURSE',
]

export function canWriteBilling(role: AppRole): boolean {
  return (BILLING_WRITE_ROLES as readonly string[]).includes(role)
}

export function canCreateBilling(role: AppRole): boolean {
  return canWriteBilling(role) || (BILLING_CREATE_ROLES as readonly string[]).includes(role)
}

export function canViewBilling(role: AppRole): boolean {
  return canCreateBilling(role) || (BILLING_VIEW_ROLES as readonly string[]).includes(role)
}

export function canVoidInvoice(role: AppRole): boolean {
  return canWriteBilling(role)
}

/** All roles allowed to access billing routes */
export const BILLING_ACCESS_ROLES: readonly AppRole[] = [
  ...BILLING_WRITE_ROLES,
  ...BILLING_CREATE_ROLES,
  ...BILLING_VIEW_ROLES,
]
