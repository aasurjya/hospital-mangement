import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { AnalyticsCharts } from './analytics-charts'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const { profile } = await requireAuth()
  const hospitalId = profile.hospital_id!
  const supabase = await createSupabaseServerClient()

  // Fetch data for charts
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

  const [
    { data: admissions },
    { data: appointments },
    { data: labOrders },
    { data: opdEntries },
    { data: invoices },
    { data: patients },
  ] = await Promise.all([
    supabase.from('admissions').select('id, admitted_at, discharged_at, status')
      .eq('hospital_id', hospitalId).gte('admitted_at', thirtyDaysAgo).order('admitted_at'),
    supabase.from('appointments').select('id, scheduled_at, status')
      .eq('hospital_id', hospitalId).gte('scheduled_at', thirtyDaysAgo).order('scheduled_at'),
    supabase.from('lab_orders').select('id, created_at, completed_at, status, priority')
      .eq('hospital_id', hospitalId).gte('created_at', thirtyDaysAgo).order('created_at'),
    supabase.from('opd_queue').select('id, checked_in_at, completed_at, triage_level, status')
      .eq('hospital_id', hospitalId).gte('checked_in_at', thirtyDaysAgo).order('checked_in_at'),
    supabase.from('invoices').select('id, created_at, total, amount_paid, status')
      .eq('hospital_id', hospitalId).gte('created_at', thirtyDaysAgo).order('created_at'),
    supabase.from('patients').select('id, gender, date_of_birth, created_at')
      .eq('hospital_id', hospitalId),
  ])

  // Process data for charts
  const admissionsByDay = groupByDay(admissions ?? [], 'admitted_at')
  const appointmentsByDay = groupByDay(appointments ?? [], 'scheduled_at')

  const revenueByDay = (invoices ?? []).reduce((acc, inv) => {
    const day = new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const existing = acc.find((d) => d.day === day)
    if (existing) {
      existing.total += inv.total
      existing.collected += inv.amount_paid
    } else {
      acc.push({ day, total: inv.total, collected: inv.amount_paid })
    }
    return acc
  }, [] as { day: string; total: number; collected: number }[])

  // Demographics
  const genderDist = (patients ?? []).reduce((acc, p) => {
    const g = p.gender ?? 'Unknown'
    acc[g] = (acc[g] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const genderData = Object.entries(genderDist).map(([name, value]) => ({ name, value }))

  // Lab turnaround
  const labCompleted = (labOrders ?? []).filter((l) => l.completed_at && l.created_at)
  const avgTurnaround = labCompleted.length > 0
    ? Math.round(labCompleted.reduce((sum, l) => {
        return sum + (new Date(l.completed_at!).getTime() - new Date(l.created_at).getTime()) / 3600000
      }, 0) / labCompleted.length)
    : 0

  // OPD wait times by triage
  const opdByTriage = (opdEntries ?? []).reduce((acc, e) => {
    const level = e.triage_level
    acc[level] = (acc[level] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const triageData = Object.entries(opdByTriage).map(([name, value]) => ({ name, value }))

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Analytics</h1>
      <p className="text-sm text-neutral-500">Last 30 days</p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Admissions" value={admissions?.length ?? 0} />
        <KpiCard label="Appointments" value={appointments?.length ?? 0} />
        <KpiCard label="Lab Orders" value={labOrders?.length ?? 0} />
        <KpiCard label="Avg Lab TAT" value={`${avgTurnaround}h`} />
      </div>

      <AnalyticsCharts
        admissionsByDay={admissionsByDay}
        appointmentsByDay={appointmentsByDay}
        revenueByDay={revenueByDay}
        genderData={genderData}
        triageData={triageData}
      />
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900">{value}</p>
    </div>
  )
}

function groupByDay(items: { [k: string]: unknown }[], dateField: string) {
  return items.reduce((acc, item) => {
    const day = new Date(item[dateField] as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const existing = acc.find((d) => d.day === day)
    if (existing) {
      existing.count++
    } else {
      acc.push({ day, count: 1 })
    }
    return acc
  }, [] as { day: string; count: number }[])
}
