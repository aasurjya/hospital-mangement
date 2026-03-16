'use client'

import { useActionState, useState, useTransition } from 'react'
import { bulkCreateRoomsAction, previewRoomsAction, type RoomActionState } from '../actions'
import { formatLabel } from '@/lib/format'
import { ROOM_TYPES } from '../constants'
import { btn, input, alert } from '@/lib/styles'

type PreviewRoom = { room_number: string; room_type: string; floor: string | null }
type Step = 'configure' | 'preview'

const defaultConfig = { room_type: 'GENERAL', floor: '', prefix: '', quantity: '1', notes: '' }

export default function NewRoomsPage() {
  const [step, setStep] = useState<Step>('configure')
  const [config, setConfig] = useState(defaultConfig)
  const [preview, setPreview] = useState<PreviewRoom[]>([])
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isPreviewing, startPreview] = useTransition()

  const [createState, createAction, isCreating] = useActionState<RoomActionState, FormData>(
    bulkCreateRoomsAction,
    null
  )

  function handleConfigChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setConfig((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePreview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPreviewError(null)
    const formData = new FormData(e.currentTarget)

    startPreview(async () => {
      const result = await previewRoomsAction(null, formData)
      if (result?.error) {
        setPreviewError(result.error)
        return
      }
      if (result?.fieldErrors) {
        setPreviewError(Object.values(result.fieldErrors).flat().join(' '))
        return
      }
      const rooms = (result as { rooms?: PreviewRoom[] })?.rooms
      if (rooms && rooms.length > 0) {
        setPreview(rooms)
        setStep('preview')
      }
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <a href="/hospital/rooms" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Rooms
        </a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Add rooms</h1>

        {/* Step indicator — M3 fix: simplified StepDot, L1 fix: flex-1 connector */}
        <div className="mt-4 flex items-center gap-3">
          <StepDot active={step === 'configure'} completed={step === 'preview'} label="1" />
          {/* H3 fix: "Room details" instead of "Configure" */}
          <span className={`text-sm font-medium ${step === 'configure' ? 'text-neutral-900' : 'text-neutral-500'}`}>
            Room details
          </span>
          <div className="h-px flex-1 bg-neutral-300" />
          <StepDot active={step === 'preview'} completed={false} label="2" />
          <span className={`text-sm font-medium ${step === 'preview' ? 'text-neutral-900' : 'text-neutral-500'}`}>
            Review &amp; confirm
          </span>
        </div>
      </div>

      {step === 'configure' && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <form onSubmit={handlePreview} className="space-y-5">
            {previewError && (
              <div role="alert" className={alert.error}>{previewError}</div>
            )}

            <div>
              <label htmlFor="room_type" className={input.label}>
                Room type <span className={input.required} aria-hidden="true">*</span>
              </label>
              <select
                id="room_type"
                name="room_type"
                value={config.room_type}
                onChange={handleConfigChange}
                className={input.base}
                required
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{formatLabel(t)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                {/* H4 fix: clearer label + self-explanatory placeholder */}
                <label htmlFor="prefix" className={input.label}>
                  Room number start <span className={input.required} aria-hidden="true">*</span>
                </label>
                <input
                  id="prefix"
                  name="prefix"
                  type="text"
                  value={config.prefix}
                  onChange={handleConfigChange}
                  placeholder={`e.g. "ICU-" → ICU-01, ICU-02…`}
                  className={input.base}
                  maxLength={20}
                  required
                />
              </div>

              <div>
                <label htmlFor="quantity" className={input.label}>
                  How many rooms? <span className={input.required} aria-hidden="true">*</span>
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={config.quantity}
                  onChange={handleConfigChange}
                  min={1}
                  max={50}
                  className={input.base}
                  required
                />
                {/* L2 fix: trimmed hint */}
                <p className="mt-1 text-xs text-neutral-500">Maximum 50</p>
              </div>
            </div>

            <div>
              <label htmlFor="floor" className={input.label}>
                Floor <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                id="floor"
                name="floor"
                type="text"
                value={config.floor}
                onChange={handleConfigChange}
                placeholder="e.g. 3, Ground, B1"
                className={input.base}
                maxLength={20}
              />
            </div>

            <div>
              <label htmlFor="notes" className={input.label}>
                Notes <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                value={config.notes}
                onChange={handleConfigChange}
                rows={2}
                className={input.base}
                maxLength={500}
                placeholder="e.g. Isolation wing, under renovation"
              />
            </div>

            <div className="flex gap-3 pt-2">
              {/* C2 fix: button label describes the forward action */}
              <button type="submit" disabled={isPreviewing} className={btn.primary}>
                {isPreviewing ? 'Loading preview…' : 'Continue to preview'}
              </button>
              <a href="/hospital/rooms" className={`inline-flex items-center min-h-[44px] px-3 ${btn.ghost}`}>
                Cancel
              </a>
            </div>
          </form>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-5 py-4">
              <h2 className="text-base font-medium text-neutral-900">
                {preview.length} room{preview.length !== 1 ? 's' : ''} will be created
              </h2>
              <p className="mt-0.5 text-sm text-neutral-600">
                Type: {formatLabel(config.room_type)}
                {config.floor ? ` · Floor ${config.floor}` : ''}
                {config.notes ? ` · Note: ${config.notes}` : ''}
              </p>
            </div>

            {/* M6 fix: Notes column in preview table */}
            <div className="max-h-72 overflow-y-auto">
              <table className="min-w-full divide-y divide-neutral-100">
                <thead className="bg-neutral-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Room No.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Floor</th>
                    {config.notes && (
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Notes</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {preview.map((r) => (
                    <tr key={r.room_number}>
                      <td className="px-4 py-2 text-sm font-medium text-neutral-900">{r.room_number}</td>
                      <td className="px-4 py-2 text-sm text-neutral-700">{formatLabel(r.room_type)}</td>
                      <td className="px-4 py-2 text-sm text-neutral-600">{r.floor ?? '—'}</td>
                      {config.notes && (
                        <td className="px-4 py-2 text-sm text-neutral-600">{config.notes}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {createState?.error && (
            <div role="alert" className={alert.error}>{createState.error}</div>
          )}

          <form action={createAction}>
            <input type="hidden" name="room_type" value={config.room_type} />
            <input type="hidden" name="floor" value={config.floor} />
            <input type="hidden" name="prefix" value={config.prefix} />
            <input type="hidden" name="quantity" value={config.quantity} />
            <input type="hidden" name="notes" value={config.notes} />

            {/* H1 fix: wider gap, clearer back label */}
            <div className="flex gap-6">
              <button type="submit" disabled={isCreating} className={btn.primary}>
                {isCreating ? 'Creating…' : `Create ${preview.length} room${preview.length !== 1 ? 's' : ''}`}
              </button>
              <button
                type="button"
                onClick={() => setStep('configure')}
                className={btn.secondary}
              >
                ← Edit configuration
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

/* M3 fix: simplified — only active/completed/inactive states */
function StepDot({ active, completed, label }: { active: boolean; completed: boolean; label: string }) {
  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
      active ? 'bg-primary-600 text-white' :
      completed ? 'bg-success-500 text-white' :
      'bg-neutral-200 text-neutral-500'
    }`}>
      {completed ? '✓' : label}
    </div>
  )
}
