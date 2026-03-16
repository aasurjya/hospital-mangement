'use client'

import { useActionState } from 'react'
import { btn, input, alert, card } from '@/lib/styles'
import type { NotificationTemplateActionState } from './actions'
import type { NotificationChannel } from '@/types/database'

const CHANNELS: NotificationChannel[] = ['EMAIL', 'SMS']

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
}

const PLACEHOLDER_HINTS = [
  '{{patient_name}}',
  '{{doctor_name}}',
  '{{date}}',
  '{{time}}',
  '{{hospital_name}}',
  '{{department}}',
]

type CreateAction = (
  prev: NotificationTemplateActionState,
  formData: FormData
) => Promise<NotificationTemplateActionState>

type UpdateAction = (
  prev: NotificationTemplateActionState,
  formData: FormData
) => Promise<NotificationTemplateActionState>

type NotificationTemplateFormProps = {
  knownEventKeys: string[]
  createAction: CreateAction
  /** Present when editing an existing template */
  existingTemplate?: {
    id: string
    event_key: string
    channel: NotificationChannel
    subject: string | null
    body_template: string
    is_active: boolean
  }
  updateAction?: UpdateAction
}

export function NotificationTemplateForm({
  knownEventKeys,
  createAction,
  existingTemplate,
  updateAction,
}: NotificationTemplateFormProps) {
  const isEditing = !!existingTemplate

  const [createState, createDispatch, isCreating] = useActionState(createAction, null)
  const [updateState, updateDispatch, isUpdating] = useActionState(
    updateAction ?? (async (_p: NotificationTemplateActionState, _fd: FormData) => null),
    null
  )

  const state = isEditing ? updateState : createState
  const dispatch = isEditing ? updateDispatch : createDispatch
  const isPending = isEditing ? isUpdating : isCreating

  return (
    <form action={dispatch} className={`${card.base} space-y-5`}>
      {state?.error && (
        <div className={alert.error} role="alert">
          {state.error}
        </div>
      )}

      {state && !state.error && state.templateId && (
        <div className={alert.success} role="status" aria-live="polite">
          Template {isEditing ? 'updated' : 'created'} successfully.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="event_key" className={input.label}>
            Event <span className={input.required}>*</span>
          </label>
          {knownEventKeys.length > 0 ? (
            <select
              id="event_key"
              name="event_key"
              required
              defaultValue={existingTemplate?.event_key ?? ''}
              className={input.base}
            >
              <option value="" disabled>
                Select an event…
              </option>
              {knownEventKeys.map((key) => (
                <option key={key} value={key}>
                  {key
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </option>
              ))}
              <option value="__custom__">Custom event key…</option>
            </select>
          ) : (
            <input
              id="event_key"
              name="event_key"
              type="text"
              required
              defaultValue={existingTemplate?.event_key ?? ''}
              placeholder="e.g. appointment_reminder"
              className={input.base}
            />
          )}
          {state?.fieldErrors?.event_key && (
            <p className={input.error}>{state.fieldErrors.event_key[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="channel" className={input.label}>
            Channel <span className={input.required}>*</span>
          </label>
          <select
            id="channel"
            name="channel"
            required
            defaultValue={existingTemplate?.channel ?? ''}
            className={input.base}
          >
            <option value="" disabled>
              Select channel…
            </option>
            {CHANNELS.map((ch) => (
              <option key={ch} value={ch}>
                {CHANNEL_LABELS[ch]}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.channel && (
            <p className={input.error}>{state.fieldErrors.channel[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className={input.label}>
          Subject <span className="text-xs font-normal text-neutral-500">(email only)</span>
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          defaultValue={existingTemplate?.subject ?? ''}
          placeholder="e.g. Your appointment is confirmed for {{date}}"
          maxLength={250}
          className={input.base}
        />
        {state?.fieldErrors?.subject && (
          <p className={input.error}>{state.fieldErrors.subject[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="body_template" className={input.label}>
          Body Template <span className={input.required}>*</span>
        </label>
        <textarea
          id="body_template"
          name="body_template"
          rows={6}
          required
          defaultValue={existingTemplate?.body_template ?? ''}
          placeholder="Dear {{patient_name}}, your appointment with {{doctor_name}} is scheduled for {{date}} at {{time}}."
          className={`${input.base} resize-y font-mono text-xs`}
        />
        <p className="mt-1 text-xs text-neutral-500">
          Available placeholders:{' '}
          {PLACEHOLDER_HINTS.map((ph, i) => (
            <span key={ph}>
              <code className="rounded bg-neutral-100 px-1 font-mono text-neutral-700">{ph}</code>
              {i < PLACEHOLDER_HINTS.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
        {state?.fieldErrors?.body_template && (
          <p className={input.error}>{state.fieldErrors.body_template[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          defaultChecked={existingTemplate?.is_active ?? true}
          value="true"
          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="is_active" className="text-sm text-neutral-700">
          Active — this template will be used when the event fires
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isPending} className={btn.primary}>
          {isPending
            ? isEditing
              ? 'Saving…'
              : 'Creating…'
            : isEditing
            ? 'Save Changes'
            : 'Create Template'}
        </button>
      </div>
    </form>
  )
}
