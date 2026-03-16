/**
 * Convert SCREAMING_SNAKE_CASE enum values to Title Case labels.
 * e.g. "HOSPITAL_ADMIN" → "Hospital Admin", "DOCTOR" → "Doctor"
 */
export function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
