import { randomBytes } from 'crypto'

/** Generate a unique lab order number: LAB-YYYY-XXXXXXXX */
export function generateLabOrderNumber(): string {
  const year = new Date().getFullYear()
  const hex = randomBytes(4).toString('hex').toUpperCase()
  return `LAB-${year}-${hex}`
}
