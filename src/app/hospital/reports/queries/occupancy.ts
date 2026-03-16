import type { SupabaseClient } from '@supabase/supabase-js'
import type { OccupancyReport } from '@/lib/reports/types'

export async function fetchOccupancyReport(
  supabase: SupabaseClient,
  hospitalId: string
): Promise<OccupancyReport> {
  const [roomsResult, admissionsResult] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, room_type, is_available')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true),
    supabase
      .from('admissions')
      .select('room_id')
      .eq('hospital_id', hospitalId)
      .eq('status', 'ADMITTED'),
  ])

  const rooms = roomsResult.data ?? []
  const admissions = admissionsResult.data ?? []

  // Count occupied rooms (unique room_ids with active admissions)
  const occupiedRoomIds = new Set(
    admissions.map((a) => a.room_id).filter(Boolean)
  )

  const totalRooms = rooms.length
  const availableRooms = rooms.filter((r) => r.is_available).length
  const occupiedRooms = occupiedRoomIds.size
  const occupancyRate = totalRooms > 0
    ? Math.round((occupiedRooms / totalRooms) * 100)
    : 0

  // Group by room type
  const typeMap = new Map<string, { total: number; occupied: number; available: number }>()
  for (const room of rooms) {
    const entry = typeMap.get(room.room_type) ?? { total: 0, occupied: 0, available: 0 }
    entry.total += 1
    if (room.is_available) entry.available += 1
    if (occupiedRoomIds.has(room.id)) entry.occupied += 1
    typeMap.set(room.room_type, entry)
  }

  const byRoomType = [...typeMap.entries()]
    .map(([roomType, data]) => ({
      roomType,
      ...data,
      rate: data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.occupied - a.occupied)

  return { totalRooms, availableRooms, occupiedRooms, occupancyRate, byRoomType }
}
