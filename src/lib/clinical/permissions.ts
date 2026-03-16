import type { AppRole } from '@/types/database'

/** Roles that can create/edit allergies */
const ALLERGY_WRITE_ROLES: readonly AppRole[] = ['DOCTOR', 'NURSE']

/** Roles that can create/edit diagnoses */
const DIAGNOSIS_WRITE_ROLES: readonly AppRole[] = ['DOCTOR']

/** Roles that can record vital signs */
const VITALS_WRITE_ROLES: readonly AppRole[] = ['DOCTOR', 'NURSE']

/** Roles that can view clinical data */
const CLINICAL_VIEW_ROLES: readonly AppRole[] = [
  'HOSPITAL_ADMIN',
  'DOCTOR',
  'NURSE',
  'PHARMACIST',
]

export function canWriteAllergies(role: AppRole): boolean {
  return (ALLERGY_WRITE_ROLES as readonly string[]).includes(role)
}

export function canWriteDiagnoses(role: AppRole): boolean {
  return (DIAGNOSIS_WRITE_ROLES as readonly string[]).includes(role)
}

export function canWriteVitals(role: AppRole): boolean {
  return (VITALS_WRITE_ROLES as readonly string[]).includes(role)
}

export function canViewClinicalData(role: AppRole): boolean {
  return (CLINICAL_VIEW_ROLES as readonly string[]).includes(role)
}

/** For use with requireRoles() in server actions */
export const ALLERGY_MANAGEMENT_ROLES: AppRole[] = [...ALLERGY_WRITE_ROLES]
export const DIAGNOSIS_MANAGEMENT_ROLES: AppRole[] = [...DIAGNOSIS_WRITE_ROLES]
export const VITALS_MANAGEMENT_ROLES: AppRole[] = [...VITALS_WRITE_ROLES]
