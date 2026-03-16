'use client'

import { filterBar, input } from '@/lib/styles'
import { PERIOD_OPTIONS } from '@/lib/reports/periods'
import type { ReportPeriod } from '@/lib/reports/periods'

const TABS = [
  { value: 'occupancy', label: 'Occupancy' },
  { value: 'financial', label: 'Financial' },
  { value: 'patients', label: 'Patients' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'staff', label: 'Staff' },
] as const

interface Props {
  activeTab: string
  activePeriod: string
}

function buildHref(tab: string, period: string) {
  const params = new URLSearchParams()
  params.set('tab', tab)
  if (tab !== 'occupancy') params.set('period', period)
  return `?${params.toString()}`
}

export function ReportTabs({ activeTab, activePeriod }: Props) {
  const showPeriod = activeTab !== 'occupancy'

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className={filterBar.outer} role="navigation" aria-label="Report sections">
        <div className={filterBar.inner}>
          {TABS.map((tab) => (
            <a
              key={tab.value}
              href={buildHref(tab.value, activePeriod)}
              aria-current={activeTab === tab.value ? 'page' : undefined}
              className={filterBar.pill(activeTab === tab.value)}
            >
              {tab.label}
            </a>
          ))}
        </div>
      </div>

      {/* Period selector */}
      {showPeriod && (
        <div className="flex items-center gap-3">
          <label htmlFor="period" className="text-sm font-medium text-neutral-600">
            Period:
          </label>
          <select
            id="period"
            value={activePeriod}
            onChange={(e) => {
              window.location.href = buildHref(activeTab, e.target.value)
            }}
            className={`${input.base} mt-0 w-auto`}
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

export const VALID_TABS = TABS.map((t) => t.value)
