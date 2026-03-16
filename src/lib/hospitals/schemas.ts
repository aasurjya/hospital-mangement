import { z } from 'zod'

export const createHospitalSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  address: z.string().max(300).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
})

export const editHospitalSchema = createHospitalSchema.extend({
  is_active: z.boolean().optional(),
})

export const createHospitalAdminSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
})

export type CreateHospitalInput = z.infer<typeof createHospitalSchema>
export type EditHospitalInput = z.infer<typeof editHospitalSchema>
export type CreateHospitalAdminInput = z.infer<typeof createHospitalAdminSchema>

/** Convert a hospital name to a URL-safe slug */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}
