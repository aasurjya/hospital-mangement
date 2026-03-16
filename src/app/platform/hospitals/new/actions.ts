'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePlatformAdmin } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { createHospitalSchema, nameToSlug } from '@/lib/hospitals/schemas'

export type CreateHospitalState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

export async function createHospitalAction(
  _prev: CreateHospitalState,
  formData: FormData
): Promise<CreateHospitalState> {
  const ctx = await requirePlatformAdmin()

  const raw = {
    name: formData.get('name') as string,
    slug: (formData.get('slug') as string) || nameToSlug(formData.get('name') as string),
    address: (formData.get('address') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
  }

  const parsed = createHospitalSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  const { data: hospital, error } = await supabase
    .from('hospitals')
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      address: parsed.data.address ?? null,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email || null,
    })
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A hospital with that slug already exists. Choose a different slug.' }
    }
    return { error: 'Failed to create hospital. Please try again.' }
  }

  await writeAuditLog({
    hospitalId: hospital.id,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'HOSPITAL_CREATED',
    description: `Hospital "${hospital.name}" created`,
    metadata: { hospitalId: hospital.id, name: hospital.name, slug: parsed.data.slug },
  })

  revalidatePath('/platform/hospitals')
  redirect(`/platform/hospitals/${hospital.id}`)
}
