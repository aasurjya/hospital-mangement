import { notFound } from 'next/navigation'
import { requirePlatformAdmin } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CreateAdminForm } from './admin-form'

export const metadata = { title: 'Add Hospital Admin | Platform Admin' }

export default async function NewHospitalAdminPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePlatformAdmin()
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: hospital } = await supabase
    .from('hospitals')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!hospital) notFound()

  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="mb-6">
        <a href={`/platform/hospitals/${id}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← {hospital.name}
        </a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Add hospital admin</h1>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <CreateAdminForm hospitalId={id} hospitalName={hospital.name} />
      </div>
    </div>
  )
}
