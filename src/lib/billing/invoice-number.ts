import { randomBytes } from 'crypto'

/**
 * Generate a unique invoice number.
 * Format: INV-{YEAR}-{8-char hex}
 * Uniqueness enforced at DB level (hospital_id, invoice_number unique index).
 */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const hex = randomBytes(4).toString('hex').toUpperCase()
  return `INV-${year}-${hex}`
}
