import { notFound } from 'next/navigation'
import { requirePlatformAdmin } from '@/lib/rbac/guards'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { EditAdminForm } from './edit-admin-form'

export const metadata = { title: 'Edit Hospital Admin | Platform Admin' }

export default async function EditAdminPage({
  params,
}: {
  params: Promise<{ id: string; adminId: string }>
}) {
  await requirePlatformAdmin()
  const { id: hospitalId, adminId } = await params

  const supabase = createSupabaseServiceClient()
  const { data: admin } = await supabase
    .from('user_profiles')
    .select('id, full_name, phone, is_active, created_at')
    .eq('id', adminId)
    .eq('hospital_id', hospitalId)
    .eq('role', 'HOSPITAL_ADMIN')
    .single()

  if (!admin) notFound()

  // Get email from auth admin API
  const { data: authUser } = await supabase.auth.admin.getUserById(adminId)
  const email = authUser?.user?.email ?? ''

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-2">
      {/* Breadcrumb */}
      <nav className="text-sm text-neutral-500 space-x-1">
        <a href="/platform/hospitals" className="hover:text-neutral-700">Hospitals</a>
        <span>/</span>
        <a href={`/platform/hospitals/${hospitalId}`} className="hover:text-neutral-700">Hospital</a>
        <span>/</span>
        <span className="text-neutral-900">Edit admin</span>
      </nav>

      <h1 className="text-2xl font-semibold text-neutral-900 pt-2">Edit hospital admin</h1>
      <p className="text-sm text-neutral-500">{email}</p>

      <div className="pt-4">
        <EditAdminForm
          hospitalId={hospitalId}
          adminId={adminId}
          initialData={{ full_name: admin.full_name ?? '', phone: admin.phone ?? '', is_active: admin.is_active }}
        />
      </div>
    </div>
  )
}
