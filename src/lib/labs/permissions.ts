import type { AppRole } from '@/types/database'

const ORDER_ROLES: readonly AppRole[] = ['DOCTOR']
const PROCESS_ROLES: readonly AppRole[] = ['LAB_TECHNICIAN']
const CATALOGUE_ROLES: readonly AppRole[] = ['LAB_TECHNICIAN', 'HOSPITAL_ADMIN']

export function canOrderLab(role: AppRole): boolean {
  return (ORDER_ROLES as readonly string[]).includes(role)
}

export function canProcessLab(role: AppRole): boolean {
  return (PROCESS_ROLES as readonly string[]).includes(role)
}

export function canManageCatalogue(role: AppRole): boolean {
  return (CATALOGUE_ROLES as readonly string[]).includes(role)
}

export const LAB_ORDER_ROLES: AppRole[] = [...ORDER_ROLES]
export const LAB_PROCESS_ROLES: AppRole[] = [...PROCESS_ROLES]
export const LAB_CATALOGUE_ROLES: AppRole[] = [...CATALOGUE_ROLES]
