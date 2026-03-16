'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireHospitalAdmin } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit/log'
import { z } from 'zod'

const deptSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
})

export type DeptState = { error?: string; fieldErrors?: Record<string, string[]> } | null

export async function createDepartmentAction(
  _prev: DeptState,
  formData: FormData
): Promise<DeptState> {
  const ctx = await requireHospitalAdmin()
  const hospitalId = ctx.profile.hospital_id!

  const parsed = deptSchema.safeParse({
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
  })
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const supabase = createSupabaseServiceClient()
  const { data: dept, error } = await supabase
    .from('departments')
    .insert({ hospital_id: hospitalId, name: parsed.data.name, description: parsed.data.description ?? null })
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'A department with that name already exists.' }
    return { error: 'Failed to create department.' }
  }

  await writeAuditLog({
    hospitalId,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'DEPARTMENT_CREATED',
    description: `Department "${dept.name}" created`,
    metadata: { departmentId: dept.id },
  })

  revalidatePath('/hospital/departments')
  redirect('/hospital/departments')
}

export async function toggleDepartmentAction(deptId: string, isActive: boolean): Promise<void> {
  const ctx = await requireHospitalAdmin()
  const supabase = createSupabaseServiceClient()

  await supabase
    .from('departments')
    .update({ is_active: isActive })
    .eq('id', deptId)
    .eq('hospital_id', ctx.profile.hospital_id!)

  await writeAuditLog({
    hospitalId: ctx.profile.hospital_id!,
    actorId: ctx.userId,
    actorRole: ctx.profile.role,
    eventType: 'DEPARTMENT_UPDATED',
    description: `Department ${isActive ? 'activated' : 'deactivated'}`,
    metadata: { departmentId: deptId, is_active: isActive },
  })

  revalidatePath('/hospital/departments')
}
