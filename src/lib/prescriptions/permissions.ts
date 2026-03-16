import type { AppRole } from '@/types/database'

/** Roles that can create prescriptions */
const PRESCRIBE_ROLES: readonly AppRole[] = ['DOCTOR']

/** Roles that can manage the formulary */
const FORMULARY_ROLES: readonly AppRole[] = ['PHARMACIST', 'HOSPITAL_ADMIN']

/** Roles that can dispense medication */
const DISPENSE_ROLES: readonly AppRole[] = ['PHARMACIST']

/** Roles that can administer medication */
const ADMINISTER_ROLES: readonly AppRole[] = ['NURSE', 'DOCTOR']

export function canPrescribe(role: AppRole): boolean {
  return (PRESCRIBE_ROLES as readonly string[]).includes(role)
}

export function canManageFormulary(role: AppRole): boolean {
  return (FORMULARY_ROLES as readonly string[]).includes(role)
}

export function canDispense(role: AppRole): boolean {
  return (DISPENSE_ROLES as readonly string[]).includes(role)
}

export function canAdminister(role: AppRole): boolean {
  return (ADMINISTER_ROLES as readonly string[]).includes(role)
}

export const PRESCRIBE_MANAGEMENT_ROLES: AppRole[] = [...PRESCRIBE_ROLES]
export const FORMULARY_MANAGEMENT_ROLES: AppRole[] = [...FORMULARY_ROLES]
export const DISPENSE_MANAGEMENT_ROLES: AppRole[] = [...DISPENSE_ROLES]
export const ADMINISTER_MANAGEMENT_ROLES: AppRole[] = [...ADMINISTER_ROLES]
