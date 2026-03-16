/**
 * Temporary password generation for admin-created accounts.
 * Generated password is shown once at creation/reset time.
 * Supabase Auth stores only the bcrypt hash — never retrievable.
 */
import { randomBytes } from 'crypto'

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*-_'
const ALL = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS

/**
 * Generate a cryptographically random temporary password.
 * Guarantees at least 1 char from each required class.
 * Length: 16 characters.
 */
export function generateTempPassword(): string {
  const bytes = randomBytes(32)

  const pick = (charset: string, byteIndex: number) =>
    charset[bytes[byteIndex] % charset.length]

  const required = [
    pick(UPPERCASE, 0),
    pick(LOWERCASE, 1),
    pick(DIGITS, 2),
    pick(SYMBOLS, 3),
  ]

  const rest = Array.from({ length: 12 }, (_, i) => pick(ALL, i + 4))

  const combined = [...required, ...rest]

  // Fisher-Yates shuffle using remaining random bytes
  for (let i = combined.length - 1; i > 0; i--) {
    const j = bytes[16 + i] % (i + 1)
    ;[combined[i], combined[j]] = [combined[j], combined[i]]
  }

  return combined.join('')
}
