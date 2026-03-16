import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata = { title: 'Bed Board' }

export default async function BedBoardPage() {
  const { profile } = await requireAuth()
  const hospitalId = profile.hospital_id!
  const supabase = await createSupabaseServerClient()

  const [{ data: beds }, { data: rooms }] = await Promise.all([
    supabase
      .from('beds')
      .select('*, rooms!inner(room_number, room_type, floor), patients(full_name, mrn)')
      .eq('hospital_id', hospitalId)
      .order('bed_number'),
    supabase
      .from('rooms')
      .select('id, room_number, floor, room_type')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('floor')
      .order('room_number'),
  ])

  // Group beds by floor
  const floorMap = new Map<string, typeof beds>()
  for (const bed of beds ?? []) {
    const room = bed.rooms as unknown as { room_number: string; room_type: string; floor: string | null }
    const floor = room.floor ?? 'Unassigned'
    if (!floorMap.has(floor)) floorMap.set(floor, [])
    floorMap.get(floor)!.push(bed)
  }

  const floors = Array.from(floorMap.entries()).sort(([a], [b]) => a.localeCompare(b))

  // Stats
  const totalBeds = beds?.length ?? 0
  const occupiedBeds = beds?.filter((b) => !b.is_available).length ?? 0
  const availableBeds = totalBeds - occupiedBeds
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Bed Board</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Beds" value={totalBeds} />
        <StatCard label="Occupied" value={occupiedBeds} color="text-error-600" />
        <StatCard label="Available" value={availableBeds} color="text-success-600" />
        <StatCard label="Occupancy" value={`${occupancyRate}%`} />
      </div>

      {/* Floor sections */}
      {floors.length === 0 && (
        <p className="text-sm text-neutral-400">No beds configured. Beds are auto-created when rooms exist.</p>
      )}

      {floors.map(([floor, floorBeds]) => (
        <div key={floor}>
          <h2 className="mb-3 text-lg font-medium text-neutral-900">Floor {floor}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {floorBeds!.map((bed) => {
              const room = bed.rooms as unknown as { room_number: string; room_type: string; floor: string | null }
              const patient = bed.patients as unknown as { full_name: string; mrn: string } | null
              const isOccupied = !bed.is_available

              return (
                <div
                  key={bed.id}
                  className={`rounded-lg border-2 p-3 text-center transition-colors ${
                    isOccupied
                      ? 'border-error-300 bg-error-50'
                      : 'border-success-300 bg-success-50'
                  }`}
                >
                  <p className="text-xs font-medium text-neutral-500">{room.room_number}</p>
                  <p className="text-sm font-bold text-neutral-900">{bed.bed_number}</p>
                  <p className="mt-1 text-xs text-neutral-500">{room.room_type.replace(/_/g, ' ')}</p>
                  {isOccupied && patient && (
                    <div className="mt-2 border-t border-error-200 pt-1">
                      <p className="truncate text-xs font-medium text-neutral-800">{patient.full_name}</p>
                      <p className="text-[10px] font-mono text-neutral-400">{patient.mrn}</p>
                    </div>
                  )}
                  {!isOccupied && (
                    <p className="mt-2 text-xs font-medium text-success-700">Available</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color ?? 'text-neutral-900'}`}>{value}</p>
    </div>
  )
}
