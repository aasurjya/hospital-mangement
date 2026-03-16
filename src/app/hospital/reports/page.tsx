import type { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { canViewReports } from '@/lib/reports/permissions'
import { getDateRange, VALID_PERIODS } from '@/lib/reports/periods'
import type { ReportPeriod } from '@/lib/reports/periods'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatLabel } from '@/lib/format'
import { table, btn } from '@/lib/styles'
import { ReportTabs, VALID_TABS } from './report-tabs'
import { ReportStatCard } from './stat-card'
import { fetchOccupancyReport } from './queries/occupancy'
import { fetchFinancialReport } from './queries/financial'
import { fetchPatientReport } from './queries/patients'
import { fetchAppointmentReport } from './queries/appointments'
import { fetchStaffReport } from './queries/staff'

export const metadata = { title: 'Reports' }

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string }>
}) {
  const { profile } = await requireAuth()
  if (!canViewReports(profile.role)) redirect('/unauthorized')

  const { tab: rawTab, period: rawPeriod } = await searchParams
  const activeTab = VALID_TABS.includes(rawTab as typeof VALID_TABS[number]) ? rawTab! : 'occupancy'
  const activePeriod = VALID_PERIODS.includes(rawPeriod ?? '') ? (rawPeriod as ReportPeriod) : 'this_month'
  const dateRange = getDateRange(activePeriod)

  const supabase = await createSupabaseServerClient()
  const hospitalId = profile.hospital_id!

  const exportHref = `/api/reports/export?tab=${activeTab}&period=${activePeriod}`

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Reports</h1>
        <a href={exportHref} className={btn.secondary} download>
          Export CSV
        </a>
      </div>

      <div className="mb-6">
        <ReportTabs activeTab={activeTab} activePeriod={activePeriod} />
      </div>

      {activeTab === 'occupancy' && <OccupancySection supabase={supabase} hospitalId={hospitalId} />}
      {activeTab === 'financial' && <FinancialSection supabase={supabase} hospitalId={hospitalId} dateRange={dateRange} />}
      {activeTab === 'patients' && <PatientSection supabase={supabase} hospitalId={hospitalId} dateRange={dateRange} />}
      {activeTab === 'appointments' && <AppointmentSection supabase={supabase} hospitalId={hospitalId} dateRange={dateRange} />}
      {activeTab === 'staff' && <StaffSection supabase={supabase} hospitalId={hospitalId} dateRange={dateRange} />}
    </div>
  )
}

/* ── Section Components ── */

async function OccupancySection({ supabase, hospitalId }: SectionProps) {
  const data = await fetchOccupancyReport(supabase, hospitalId)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReportStatCard label="Total Rooms" value={data.totalRooms} />
        <ReportStatCard label="Occupied" value={data.occupiedRooms} />
        <ReportStatCard label="Available" value={data.availableRooms} />
        <ReportStatCard label="Occupancy Rate" value={data.occupancyRate} suffix="%" />
      </div>
      {data.byRoomType.length > 0 ? (
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="Occupancy by room type">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Room Type</th>
                <th className={table.headerCell}>Total</th>
                <th className={table.headerCell}>Occupied</th>
                <th className={table.headerCell}>Available</th>
                <th className={table.headerCell}>Rate</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {data.byRoomType.map((row) => (
                <tr key={row.roomType} className={table.row}>
                  <td className={`${table.cell} font-medium text-neutral-900`}>{formatLabel(row.roomType)}</td>
                  <td className={`${table.cell} text-neutral-700`}>{row.total}</td>
                  <td className={`${table.cell} text-neutral-700`}>{row.occupied}</td>
                  <td className={`${table.cell} text-neutral-700`}>{row.available}</td>
                  <td className={`${table.cell} text-neutral-700`}>{row.rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No rooms found." />
      )}
    </div>
  )
}

async function FinancialSection({ supabase, hospitalId, dateRange }: SectionPropsWithDate) {
  const data = await fetchFinancialReport(supabase, hospitalId, dateRange!)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReportStatCard label="Revenue" value={formatCurrency(data.totalRevenue)} />
        <ReportStatCard label="Outstanding" value={formatCurrency(data.outstandingAmount)} />
        <ReportStatCard label="Invoices" value={data.invoiceCount} />
        <ReportStatCard label="Paid" value={data.paidCount} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {data.byStatus.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">By Invoice Status</h3>
            <div className={table.wrapper}>
              <table className="min-w-full divide-y divide-neutral-200" aria-label="Invoices by status">
                <thead className={table.header}>
                  <tr>
                    <th className={table.headerCell}>Status</th>
                    <th className={table.headerCell}>Count</th>
                    <th className={table.headerCell}>Total</th>
                  </tr>
                </thead>
                <tbody className={table.body}>
                  {data.byStatus.map((row) => (
                    <tr key={row.status} className={table.row}>
                      <td className={`${table.cell} font-medium text-neutral-900`}>{formatLabel(row.status)}</td>
                      <td className={`${table.cell} text-neutral-700`}>{row.count}</td>
                      <td className={`${table.cell} text-neutral-700`}>{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {data.byPaymentMethod.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">By Payment Method</h3>
            <div className={table.wrapper}>
              <table className="min-w-full divide-y divide-neutral-200" aria-label="Payments by method">
                <thead className={table.header}>
                  <tr>
                    <th className={table.headerCell}>Method</th>
                    <th className={table.headerCell}>Count</th>
                    <th className={table.headerCell}>Amount</th>
                  </tr>
                </thead>
                <tbody className={table.body}>
                  {data.byPaymentMethod.map((row) => (
                    <tr key={row.method} className={table.row}>
                      <td className={`${table.cell} font-medium text-neutral-900`}>{formatLabel(row.method)}</td>
                      <td className={`${table.cell} text-neutral-700`}>{row.count}</td>
                      <td className={`${table.cell} text-neutral-700`}>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {data.byStatus.length === 0 && data.byPaymentMethod.length === 0 && (
        <EmptyState message="No billing data for this period." />
      )}
    </div>
  )
}

async function PatientSection({ supabase, hospitalId, dateRange }: SectionPropsWithDate) {
  const data = await fetchPatientReport(supabase, hospitalId, dateRange!)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReportStatCard label="Admissions" value={data.totalAdmissions} />
        <ReportStatCard label="Discharges" value={data.totalDischarges} />
        <ReportStatCard label="Avg Stay" value={data.avgLengthOfStayDays} suffix="days" />
        <ReportStatCard label="New Patients" value={data.newPatients} />
      </div>
      {data.byDepartment.length > 0 ? (
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="Patient statistics by department">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Department</th>
                <th className={table.headerCell}>Admissions</th>
                <th className={table.headerCell}>Discharges</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {data.byDepartment.map((row) => (
                <tr key={row.departmentName} className={table.row}>
                  <td className={`${table.cell} font-medium text-neutral-900`}>{row.departmentName}</td>
                  <td className={`${table.cell} text-neutral-700`}>{row.admissions}</td>
                  <td className={`${table.cell} text-neutral-700`}>{row.discharges}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No patient data for this period." />
      )}
    </div>
  )
}

async function AppointmentSection({ supabase, hospitalId, dateRange }: SectionPropsWithDate) {
  const data = await fetchAppointmentReport(supabase, hospitalId, dateRange!)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReportStatCard label="Total" value={data.totalAppointments} />
        <ReportStatCard label="Completed" value={data.completedCount} />
        <ReportStatCard label="No-Shows" value={data.noShowCount} />
        <ReportStatCard label="No-Show Rate" value={data.noShowRate} suffix="%" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {data.byDoctor.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">By Doctor</h3>
            <div className={table.wrapper}>
              <table className="min-w-full divide-y divide-neutral-200" aria-label="Appointments by doctor">
                <thead className={table.header}>
                  <tr>
                    <th className={table.headerCell}>Doctor</th>
                    <th className={table.headerCell}>Total</th>
                    <th className={table.headerCell}>Completed</th>
                    <th className={table.headerCell}>No-Shows</th>
                  </tr>
                </thead>
                <tbody className={table.body}>
                  {data.byDoctor.map((row) => (
                    <tr key={row.doctorName} className={table.row}>
                      <td className={`${table.cell} font-medium text-neutral-900`}>{row.doctorName}</td>
                      <td className={`${table.cell} text-neutral-700`}>{row.total}</td>
                      <td className={`${table.cell} text-neutral-700`}>{row.completed}</td>
                      <td className={`${table.cell} text-neutral-700`}>{row.noShows}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {data.busiestHours.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">Busiest Hours</h3>
            <div className={table.wrapper}>
              <table className="min-w-full divide-y divide-neutral-200" aria-label="Busiest appointment hours">
                <thead className={table.header}>
                  <tr>
                    <th className={table.headerCell}>Hour</th>
                    <th className={table.headerCell}>Appointments</th>
                  </tr>
                </thead>
                <tbody className={table.body}>
                  {data.busiestHours.map((row) => (
                    <tr key={row.hour} className={table.row}>
                      <td className={`${table.cell} font-medium text-neutral-900`}>{formatHour(row.hour)}</td>
                      <td className={`${table.cell} text-neutral-700`}>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {data.totalAppointments === 0 && <EmptyState message="No appointments for this period." />}
    </div>
  )
}

async function StaffSection({ supabase, hospitalId, dateRange }: SectionPropsWithDate) {
  const data = await fetchStaffReport(supabase, hospitalId, dateRange!)
  return (
    <div className="space-y-6">
      {data.byDoctor.length > 0 ? (
        <div className={table.wrapper}>
          <table className="min-w-full divide-y divide-neutral-200" aria-label="Staff workload">
            <thead className={table.header}>
              <tr>
                <th className={table.headerCell}>Doctor</th>
                <th className={table.headerCell}>Active Patients</th>
                <th className={table.headerCell}>Admissions</th>
                <th className={table.headerCell}>Appointments</th>
                <th className={table.headerCell}>Records</th>
              </tr>
            </thead>
            <tbody className={table.body}>
              {data.byDoctor.map((row) => (
                <tr key={row.doctorName} className={table.row}>
                  <td className={`${table.cell} font-medium text-neutral-900`}>{row.doctorName}</td>
                  <td className={`${table.cell} text-neutral-700`}>{row.activePatients}</td>
                  <td className={`${table.cell} text-neutral-700`}>{row.admissions}</td>
                  <td className={`${table.cell} text-neutral-700`}>{row.appointments}</td>
                  <td className={`${table.cell} text-neutral-700`}>{row.records}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="No doctors found." />
      )}
    </div>
  )
}

/* ── Helpers ── */

type SectionProps = { supabase: SupabaseClient; hospitalId: string }
type SectionPropsWithDate = SectionProps & { dateRange: { start: string; end: string } }

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
      <p className="text-sm text-neutral-600">{message}</p>
    </div>
  )
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 || 12
  return `${h}:00 ${suffix}`
}
