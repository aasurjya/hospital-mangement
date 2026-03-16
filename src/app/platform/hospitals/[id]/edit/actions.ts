'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requirePlatformAdmin } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { editHospitalSchema } from '@/lib/hospitals/schemas'

export type EditHospitalState = {
  error?: string
  fieldErrors?: Record<string, string[]>
} | null

export async function editHospitalAction(
  hospitalId: string,
  _prev: EditHospitalState,
  formData: FormData
): Promise<EditHospitalState> {
  const ctx = await requirePlatformAdmin()

  const raw = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    address: (formData.get('address') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    is_active: formData.get('is_active') === 'true',
  }

  const parsed = editHospitalSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()

  const { data: hospital, error } = await supabase
    .from('hospitals')
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      address: parsed.data.address ?? null,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email || null,
      is_active: parsed.data.is_active ?? true,
    })
    .eq('id', hospitalId)
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A hospital with that slug already exists.' }
    }
    return { error: 'Failed to update hospital. Please try again.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'HOSPITAL_UPDATED',
    description: `Hospital "${hospital.name}" updated`,
    metadata: { hospitalId, changes: raw },
  })

  revalidatePath(`/platform/hospitals/${hospitalId}`)
  revalidatePath('/platform/hospitals')
  redirect(`/platform/hospitals/${hospitalId}`)
}
