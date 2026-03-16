'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatLabel } from '@/lib/format'
import { statusBadge, table, btn, alert } from '@/lib/styles'
import { bulkToggleAvailabilityAction, type BulkToggleState } from './actions'
import type { Room } from '@/types/database'

interface Props {
  rooms: Room[]
  canManage: boolean
  occupancyMap: Record<string, number>
}

export function RoomTable({ rooms, canManage, occupancyMap }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkState, setBulkState] = useState<BulkToggleState>(null)
  const [isPending, startTransition] = useTransition()

  const allSelected = rooms.length > 0 && selected.size === rooms.length
  const someSelected = selected.size > 0

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(rooms.map((r) => r.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleBulkToggle(isAvailable: boolean) {
    const ids = [...selected]
    const occupiedCount = ids.filter((id) => (occupancyMap[id] ?? 0) > 0).length
    const action = isAvailable ? 'available' : 'unavailable'

    let message = `Mark ${ids.length} room(s) as ${action}?`
    if (occupiedCount > 0 && !isAvailable) {
      message += `\n\n${occupiedCount} of these room(s) have active patients. They will not be discharged — this only blocks new admissions.`
    }

    if (!confirm(message)) return

    startTransition(async () => {
      const result = await bulkToggleAvailabilityAction(ids, isAvailable)
      setBulkState(result)
      if (result?.status === 'success') {
        setSelected(new Set())
      }
    })
  }

  if (rooms.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
        <p className="text-sm text-neutral-600">No rooms found.</p>
        {canManage && (
          <a
            href="/hospital/rooms/new"
            className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-800"
          >
            Add rooms
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {bulkState?.status === 'success' && (
        <div role="status" aria-live="polite" className={alert.success}>
          {bulkState.count} room(s) updated successfully.
        </div>
      )}
      {bulkState?.status === 'error' && (
        <div role="alert" className={alert.error}>
          {bulkState.error}
        </div>
      )}

      <div className={table.wrapper}>
        <table className="min-w-full divide-y divide-neutral-200" aria-label="Rooms">
          <thead className={table.header}>
            <tr>
              {canManage && (
                <th className={`${table.headerCell} w-10`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rooms"
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              <th className={table.headerCell}>Room No.</th>
              <th className={table.headerCell}>Type</th>
              <th className={`${table.headerCell} hidden sm:table-cell`}>Floor</th>
              <th className={table.headerCell}>Availability</th>
              <th className={table.headerCell}>Occupancy</th>
              <th className={`${table.headerCell} hidden md:table-cell`}>Status</th>
              {canManage && <th className={table.headerCell}><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody className={table.body}>
            {rooms.map((room) => {
              const occupants = occupancyMap[room.id] ?? 0
              const isChecked = selected.has(room.id)
              return (
                <tr key={room.id} className={`${table.row} ${!room.is_active ? 'opacity-60' : ''}`}>
                  {canManage && (
                    <td className={`${table.cell} w-10`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(room.id)}
                        aria-label={`Select room ${room.room_number}`}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                  )}
                  <td className={`${table.cell} font-medium text-neutral-900`}>
                    {room.room_number}
                    {/* Mobile: show floor inline */}
                    {room.floor && (
                      <div className="mt-0.5 text-xs text-neutral-500 sm:hidden">Floor {room.floor}</div>
                    )}
                  </td>
                  <td className={`${table.cell} text-neutral-700`}>{formatLabel(room.room_type)}</td>
                  <td className={`${table.cell} text-neutral-600 hidden sm:table-cell`}>{room.floor ?? '\u2014'}</td>
                  <td className={table.cell}>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      room.is_available ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
                    }`}>
                      {room.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className={table.cell}>
                    {occupants > 0 ? (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-caution-100 text-caution-800">
                        {occupants} {occupants === 1 ? 'patient' : 'patients'}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-success-100 text-success-700">
                        Vacant
                      </span>
                    )}
                  </td>
                  <td className={`${table.cell} hidden md:table-cell`}>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      room.is_active ? statusBadge.active : statusBadge.inactive
                    }`}>
                      {room.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canManage && (
                    <td className={`${table.cell} text-right`}>
                      <Link
                        href={`/hospital/rooms/${room.id}/edit`}
                        aria-label={`Edit room ${room.room_number}`}
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        Edit
                      </Link>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk action bar */}
      {canManage && someSelected && (
        <div className="sticky bottom-4 mx-auto flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-lg">
          <span className="text-sm font-medium text-neutral-700">
            {selected.size} room{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleBulkToggle(false)}
              disabled={isPending}
              className={btn.danger}
            >
              {isPending ? 'Updating\u2026' : 'Mark unavailable'}
            </button>
            <button
              type="button"
              onClick={() => handleBulkToggle(true)}
              disabled={isPending}
              className={btn.success}
            >
              {isPending ? 'Updating\u2026' : 'Mark available'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setSelected(new Set()); setBulkState(null) }}
            className="text-sm text-neutral-500 hover:text-neutral-700 ml-auto"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
