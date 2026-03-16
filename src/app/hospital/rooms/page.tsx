import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { canWriteRooms } from '@/lib/rooms/permissions'
import { RoomTable } from './room-table'
import { ROOM_TYPES, PAGE_SIZE } from './constants'
import { filterBar } from '@/lib/styles'
import type { RoomType } from '@/types/database'

export const metadata = { title: 'Rooms' }

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; available?: string; floor?: string }>
}) {
  const { profile } = await requireAuth()
  const { page: pageStr, type, available, floor } = await searchParams
  const page = Math.max(1, parseInt(pageStr ?? '1', 10))
  const canManage = canWriteRooms(profile.role)
  const hospitalId = profile.hospital_id!

  const supabase = await createSupabaseServerClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Build main rooms query
  let query = supabase
    .from('rooms')
    .select('*', { count: 'exact' })
    .eq('hospital_id', hospitalId)
    .order('room_number')
    .range(from, to)

  if (type) query = query.eq('room_type', type as RoomType)
  if (available === 'true') query = query.eq('is_available', true)
  if (available === 'false') query = query.eq('is_available', false)
  if (floor) query = query.eq('floor', floor)

  // Fetch rooms + distinct floors in parallel
  const [roomsResult, floorsResult] = await Promise.all([
    query,
    supabase
      .from('rooms')
      .select('floor')
      .eq('hospital_id', hospitalId)
      .not('floor', 'is', null)
      .order('floor'),
  ])

  const rooms = roomsResult.data ?? []
  const totalPages = Math.ceil((roomsResult.count ?? 0) / PAGE_SIZE)

  // Deduplicate floor values
  const allFloors = [...new Set(
    (floorsResult.data ?? []).map((r) => r.floor).filter(Boolean) as string[]
  )]

  // Fetch occupancy counts for rooms on this page
  let occupancyMap: Record<string, number> = {}
  if (rooms.length > 0) {
    const roomIds = rooms.map((r) => r.id)
    const { data: admissions } = await supabase
      .from('admissions')
      .select('room_id')
      .eq('status', 'ADMITTED')
      .in('room_id', roomIds)

    if (admissions) {
      occupancyMap = admissions.reduce<Record<string, number>>((acc, a) => {
        if (a.room_id) {
          acc[a.room_id] = (acc[a.room_id] ?? 0) + 1
        }
        return acc
      }, {})
    }
  }

  // URL helpers that preserve all active filters
  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const values = { type, available, floor, page: String(page), ...overrides }
    for (const [k, v] of Object.entries(values)) {
      if (v && k !== 'page') params.set(k, v)
    }
    // Only include page if it's not 1 (or explicitly set)
    if (overrides.page && overrides.page !== '1') params.set('page', overrides.page)
    return params.size > 0 ? `?${params.toString()}` : '/hospital/rooms'
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Rooms <span className="text-sm font-normal text-neutral-600">({roomsResult.count ?? 0})</span>
        </h1>
        {canManage && (
          <a
            href="/hospital/rooms/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary-600 px-5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Add rooms
          </a>
        )}
      </div>

      <div className="mb-6 space-y-3">
        {/* Type filter */}
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">Type</p>
          <div className={filterBar.outer} role="navigation" aria-label="Filter by room type">
            <div className={filterBar.inner}>
              <a
                href={buildHref({ type: undefined, page: '1' })}
                aria-current={!type ? 'true' : undefined}
                className={filterBar.pill(!type)}
              >
                All types
              </a>
              {ROOM_TYPES.map((t) => (
                <a
                  key={t}
                  href={buildHref({ type: t, page: '1' })}
                  aria-current={type === t ? 'true' : undefined}
                  className={filterBar.pill(type === t)}
                >
                  {formatLabel(t)}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Availability filter */}
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">Availability</p>
          <div className="flex gap-2" role="navigation" aria-label="Filter by availability">
            {[
              { label: 'All', value: undefined },
              { label: 'Available', value: 'true' },
              { label: 'Unavailable', value: 'false' },
            ].map(({ label, value }) => {
              const isActive = available === value || (!available && !value)
              return (
                <a
                  key={label}
                  href={buildHref({ available: value, page: '1' })}
                  aria-current={isActive ? 'true' : undefined}
                  className={filterBar.pill(isActive)}
                >
                  {label}
                </a>
              )
            })}
          </div>
        </div>

        {/* Floor filter — only show if there are multiple floors */}
        {allFloors.length > 1 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">Floor</p>
            <div className={filterBar.outer} role="navigation" aria-label="Filter by floor">
              <div className={filterBar.inner}>
                <a
                  href={buildHref({ floor: undefined, page: '1' })}
                  aria-current={!floor ? 'true' : undefined}
                  className={filterBar.pill(!floor)}
                >
                  All floors
                </a>
                {allFloors.map((f) => (
                  <a
                    key={f}
                    href={buildHref({ floor: f, page: '1' })}
                    aria-current={floor === f ? 'true' : undefined}
                    className={filterBar.pill(floor === f)}
                  >
                    Floor {f}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <RoomTable rooms={rooms} canManage={canManage} occupancyMap={occupancyMap} />

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={buildHref({ page: String(page - 1) })}
                aria-label={`Previous page, page ${page - 1}`}
                className="inline-flex items-center min-h-[44px] rounded-md border px-3 hover:bg-neutral-50"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={buildHref({ page: String(page + 1) })}
                aria-label={`Next page, page ${page + 1}`}
                className="inline-flex items-center min-h-[44px] rounded-md border px-3 hover:bg-neutral-50"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
