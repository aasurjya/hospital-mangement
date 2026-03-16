import { requireHospitalAdmin } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { table, card, alert } from '@/lib/styles'
import { NotificationTemplateForm } from './template-form'
import {
  createNotificationTemplateAction,
  NOTIFICATION_EVENT_KEYS,
} from './actions'
import type { NotificationChannel } from '@/types/database'

export const metadata = { title: 'Notification Templates' }

const EVENT_KEY_LABELS: Record<string, string> = {
  appointment_reminder: 'Appointment Reminder',
  discharge_alert: 'Discharge Alert',
  lab_results_ready: 'Lab Results Ready',
  prescription_ready: 'Prescription Ready',
}

type TemplateRow = {
  id: string
  event_key: string
  channel: NotificationChannel
  subject: string | null
  body_template: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default async function NotificationSettingsPage() {
  const { profile } = await requireHospitalAdmin()
  const hospitalId = profile.hospital_id!

  const supabase = await createSupabaseServerClient()

  const { data: rawTemplates } = await supabase
    .from('notification_templates')
    .select('id, event_key, channel, subject, body_template, is_active, created_at, updated_at')
    .eq('hospital_id', hospitalId)
    .order('event_key')
    .order('channel')

  const templates = (rawTemplates ?? []) as TemplateRow[]

  // Group by event_key for display
  const grouped = NOTIFICATION_EVENT_KEYS.reduce<Record<string, TemplateRow[]>>((acc, key) => {
    return { ...acc, [key]: templates.filter((t) => t.event_key === key) }
  }, {})

  // Custom event keys not in the known list
  const customTemplates = templates.filter(
    (t) => !(NOTIFICATION_EVENT_KEYS as readonly string[]).includes(t.event_key)
  )

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Notification Templates</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Configure message templates for automated notifications. Use{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs font-mono text-neutral-700">
            {'{{patient_name}}'}
          </code>
          {', '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs font-mono text-neutral-700">
            {'{{date}}'}
          </code>{' '}
          and other placeholders in your template body.
        </p>
      </div>

      {/* Per-event template cards */}
      <div className="space-y-6">
        {NOTIFICATION_EVENT_KEYS.map((eventKey) => {
          const eventTemplates = grouped[eventKey] ?? []
          const label = EVENT_KEY_LABELS[eventKey] ?? formatLabel(eventKey)

          return (
            <section key={eventKey} className={card.base}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-neutral-800">{label}</h2>
                <span className="text-xs text-neutral-500">
                  {eventTemplates.length === 0
                    ? 'No templates configured'
                    : `${eventTemplates.length} template${eventTemplates.length !== 1 ? 's' : ''}`}
                </span>
              </div>

              {eventTemplates.length > 0 ? (
                <div className={table.wrapper}>
                  <table className="min-w-full divide-y divide-neutral-200" aria-label={`${label} templates`}>
                    <thead className={table.header}>
                      <tr>
                        <th className={table.headerCell}>Channel</th>
                        <th className={`${table.headerCell} hidden sm:table-cell`}>Subject</th>
                        <th className={table.headerCell}>Status</th>
                        <th className={table.headerCell}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={table.body}>
                      {eventTemplates.map((t) => (
                        <tr key={t.id} className={table.row}>
                          <td className={table.cell}>
                            <span className="inline-flex items-center rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-700">
                              {t.channel}
                            </span>
                          </td>
                          <td className={`${table.cell} hidden max-w-[240px] truncate text-neutral-600 sm:table-cell`}>
                            {t.subject ?? <span className="text-neutral-400">—</span>}
                          </td>
                          <td className={table.cell}>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                t.is_active
                                  ? 'bg-success-100 text-success-700'
                                  : 'bg-neutral-100 text-neutral-500'
                              }`}
                            >
                              {t.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className={table.cell}>
                            <a
                              href={`/hospital/settings/notifications/${t.id}/edit`}
                              className="text-sm font-medium text-primary-600 hover:text-primary-800"
                            >
                              Edit
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  No template configured for this event. Add one below.
                </p>
              )}
            </section>
          )
        })}

        {customTemplates.length > 0 && (
          <section className={card.base}>
            <h2 className="mb-4 text-base font-semibold text-neutral-800">Custom Event Templates</h2>
            <div className={table.wrapper}>
              <table className="min-w-full divide-y divide-neutral-200" aria-label="Custom notification templates">
                <thead className={table.header}>
                  <tr>
                    <th className={table.headerCell}>Event Key</th>
                    <th className={table.headerCell}>Channel</th>
                    <th className={`${table.headerCell} hidden sm:table-cell`}>Subject</th>
                    <th className={table.headerCell}>Status</th>
                    <th className={table.headerCell}>Actions</th>
                  </tr>
                </thead>
                <tbody className={table.body}>
                  {customTemplates.map((t) => (
                    <tr key={t.id} className={table.row}>
                      <td className={`${table.cell} font-mono text-xs text-neutral-700`}>
                        {t.event_key}
                      </td>
                      <td className={table.cell}>
                        <span className="inline-flex items-center rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-700">
                          {t.channel}
                        </span>
                      </td>
                      <td className={`${table.cell} hidden max-w-[200px] truncate text-neutral-600 sm:table-cell`}>
                        {t.subject ?? <span className="text-neutral-400">—</span>}
                      </td>
                      <td className={table.cell}>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.is_active
                              ? 'bg-success-100 text-success-700'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className={table.cell}>
                        <a
                          href={`/hospital/settings/notifications/${t.id}/edit`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-800"
                        >
                          Edit
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Inline create form */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-800">Add New Template</h2>
        <NotificationTemplateForm
          knownEventKeys={[...NOTIFICATION_EVENT_KEYS]}
          createAction={createNotificationTemplateAction}
        />
      </section>
    </div>
  )
}
