'use client'

import { useActionState } from 'react'
import { updateRoomAction, type RoomActionState } from '../../actions'
import { formatLabel } from '@/lib/format'
import { ROOM_TYPES } from '../../constants'
import { btn, input, alert } from '@/lib/styles'
import type { Room } from '@/types/database'

interface Props {
  room: Room
  hasActiveAdmission: boolean
}

export function EditRoomForm({ room, hasActiveAdmission }: Props) {
  const boundAction = updateRoomAction.bind(null, room.id)
  const [state, formAction, isPending] = useActionState<RoomActionState, FormData>(boundAction, null)

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6">
      {hasActiveAdmission && (
        <div role="alert" className={`mb-4 ${alert.warning}`}>
          This room has an active admission. Deactivating it will not discharge the current patient.
        </div>
      )}

      <form action={formAction} className="space-y-5">
        {state?.error && (
          <div role="alert" className={alert.error}>{state.error}</div>
        )}

        <div>
          <label htmlFor="room_number" className={input.label}>
            Room number <span className={input.required} aria-hidden="true">*</span>
          </label>
          <input
            id="room_number"
            name="room_number"
            type="text"
            defaultValue={room.room_number}
            disabled={isPending}
            className={input.base}
            maxLength={50}
            required
          />
          {state?.fieldErrors?.room_number && (
            <p className={input.error}>{state.fieldErrors.room_number[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="room_type" className={input.label}>
            Room type <span className={input.required} aria-hidden="true">*</span>
          </label>
          <select
            id="room_type"
            name="room_type"
            defaultValue={room.room_type}
            disabled={isPending}
            className={input.base}
          >
            {ROOM_TYPES.map((t) => (
              <option key={t} value={t}>{formatLabel(t)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="floor" className={input.label}>
            Floor <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <input
            id="floor"
            name="floor"
            type="text"
            defaultValue={room.floor ?? ''}
            disabled={isPending}
            className={input.base}
            maxLength={20}
            placeholder="e.g. 3, Ground, B1"
          />
        </div>

        <div>
          <label htmlFor="notes" className={input.label}>
            Notes <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={room.notes ?? ''}
            disabled={isPending}
            rows={3}
            className={input.base}
            maxLength={500}
          />
        </div>

        <fieldset className="space-y-3">
          <legend className={input.label}>Room settings</legend>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_available"
              value="on"
              defaultChecked={room.is_available}
              disabled={isPending}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-neutral-700">Available for admission</span>
          </label>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                value="on"
                defaultChecked={room.is_active}
                disabled={isPending}
                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                onChange={(e) => {
                  if (!e.target.checked && !window.confirm('Deactivate this room? It will be hidden from all workflows.')) {
                    e.target.checked = true
                  }
                }}
              />
              <span className="text-sm text-neutral-700">Active</span>
            </label>
            {/* H2 fix: clarify what "inactive" means vs "unavailable" */}
            <p className="mt-1 ml-7 text-xs text-neutral-500">
              Inactive rooms are hidden from all workflows and cannot be assigned to patients.
              Use &ldquo;Available for admission&rdquo; above to temporarily block a room without removing it.
            </p>
          </div>
        </fieldset>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isPending} className={btn.primary}>
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
          <a
            href="/hospital/rooms"
            className={`inline-flex items-center min-h-[44px] px-3 ${btn.ghost}`}
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
