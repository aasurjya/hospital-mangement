import { getDateRange, VALID_PERIODS, PERIOD_OPTIONS } from '../periods'
import type { ReportPeriod } from '../periods'

describe('getDateRange', () => {
  it.each(VALID_PERIODS as unknown as ReportPeriod[])('returns valid range for %s', (period) => {
    const range = getDateRange(period as ReportPeriod)
    expect(range.start).toBeDefined()
    expect(range.end).toBeDefined()
    expect(new Date(range.start).getTime()).toBeLessThan(new Date(range.end).getTime())
  })

  it('today: start is midnight, end is next midnight', () => {
    const range = getDateRange('today')
    const start = new Date(range.start)
    const end = new Date(range.end)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000)
  })

  it('this_week: spans exactly 7 days', () => {
    const range = getDateRange('this_week')
    const start = new Date(range.start)
    const end = new Date(range.end)
    expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('this_week: starts on Monday', () => {
    const range = getDateRange('this_week')
    const start = new Date(range.start)
    // getDay() returns 0=Sunday, 1=Monday
    expect(start.getDay()).toBe(1)
  })

  it('this_month: starts on 1st', () => {
    const range = getDateRange('this_month')
    const start = new Date(range.start)
    expect(start.getDate()).toBe(1)
  })

  it('this_month: end is 1st of next month', () => {
    const range = getDateRange('this_month')
    const start = new Date(range.start)
    const end = new Date(range.end)
    expect(end.getDate()).toBe(1)
    expect(end.getMonth()).toBe((start.getMonth() + 1) % 12)
  })

  it('last_30_days: spans 31 days (30 days ago to end of today)', () => {
    const range = getDateRange('last_30_days')
    const start = new Date(range.start)
    const end = new Date(range.end)
    const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    expect(days).toBe(31)
  })

  it('this_year: starts Jan 1', () => {
    const range = getDateRange('this_year')
    const start = new Date(range.start)
    expect(start.getMonth()).toBe(0)
    expect(start.getDate()).toBe(1)
  })

  it('this_year: ends Jan 1 next year', () => {
    const range = getDateRange('this_year')
    const start = new Date(range.start)
    const end = new Date(range.end)
    expect(end.getMonth()).toBe(0)
    expect(end.getDate()).toBe(1)
    expect(end.getFullYear()).toBe(start.getFullYear() + 1)
  })

  it('this_quarter: starts on quarter boundary month', () => {
    const range = getDateRange('this_quarter')
    const start = new Date(range.start)
    expect([0, 3, 6, 9]).toContain(start.getMonth())
    expect(start.getDate()).toBe(1)
  })

  it('all ranges return ISO strings', () => {
    for (const period of VALID_PERIODS) {
      const range = getDateRange(period as ReportPeriod)
      expect(range.start).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(range.end).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    }
  })
})

describe('PERIOD_OPTIONS', () => {
  it('has 6 options', () => {
    expect(PERIOD_OPTIONS).toHaveLength(6)
  })

  it('each option has value and label', () => {
    for (const opt of PERIOD_OPTIONS) {
      expect(opt.value).toBeTruthy()
      expect(opt.label).toBeTruthy()
    }
  })
})
