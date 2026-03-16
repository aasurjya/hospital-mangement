import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireRoles } from '@/lib/rbac/guards'
import { ROOM_MANAGEMENT_ROLES } from '@/lib/rooms/permissions'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { EditRoomForm } from './edit-room-form'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const ctx = await requireRoles(ROOM_MANAGEMENT_ROLES)
  const supabase = await createSupabaseServerClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('room_number')
    .eq('id', id)
    .eq('hospital_id', ctx.profile.hospital_id!)
    .single()
  return { title: room ? `Edit Room ${room.room_number}` : 'Edit Room' }
}

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireRoles(ROOM_MANAGEMENT_ROLES)
  const hospitalId = ctx.profile.hospital_id!

  const supabase = await createSupabaseServerClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', id)
    .eq('hospital_id', hospitalId)
    .single()

  if (!room) notFound()

  const { count: activeAdmissions } = await supabase
    .from('admissions')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', id)
    .eq('status', 'ADMITTED')

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <a href="/hospital/rooms" className="text-sm text-neutral-500 hover:text-neutral-700">
          &larr; Rooms
        </a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
          Edit room {room.room_number}
        </h1>
      </div>

      <EditRoomForm room={room} hasActiveAdmission={(activeAdmissions ?? 0) > 0} />
    </div>
  )
}
