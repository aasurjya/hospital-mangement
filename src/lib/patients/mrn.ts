import { randomBytes } from 'crypto'

/**
 * Generate a unique medical record number.
 * Format: MRN-{YEAR}-{8-char hex}
 * Uniqueness is enforced at DB level (hospital_id, mrn unique index).
 */
export function generateMrn(): string {
  const year = new Date().getFullYear()
  const hex = randomBytes(4).toString('hex').toUpperCase()
  return `MRN-${year}-${hex}`
}
