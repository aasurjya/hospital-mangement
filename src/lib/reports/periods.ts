export type ReportPeriod =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_30_days'
  | 'this_quarter'
  | 'this_year'

export const PERIOD_OPTIONS: readonly { value: ReportPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
]

export const VALID_PERIODS: readonly string[] = PERIOD_OPTIONS.map((p) => p.value)

export function getDateRange(period: ReportPeriod): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() + 1)
      break

    case 'this_week': {
      // Monday = start of week
      const day = start.getDay()
      const diff = day === 0 ? 6 : day - 1 // Sunday=6 days back, else day-1
      start.setDate(start.getDate() - diff)
      start.setHours(0, 0, 0, 0)
      end.setTime(start.getTime())
      end.setDate(end.getDate() + 7)
      break
    }

    case 'this_month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 1)
      end.setHours(0, 0, 0, 0)
      break

    case 'last_30_days':
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      end.setDate(end.getDate() + 1)
      break

    case 'this_quarter': {
      const quarter = Math.floor(now.getMonth() / 3)
      start.setMonth(quarter * 3, 1)
      start.setHours(0, 0, 0, 0)
      end.setMonth((quarter + 1) * 3, 1)
      end.setHours(0, 0, 0, 0)
      break
    }

    case 'this_year':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setFullYear(end.getFullYear() + 1, 0, 1)
      end.setHours(0, 0, 0, 0)
      break
  }

  return { start: start.toISOString(), end: end.toISOString() }
}
