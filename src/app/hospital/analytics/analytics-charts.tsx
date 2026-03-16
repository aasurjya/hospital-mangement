'use client'

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface Props {
  admissionsByDay: { day: string; count: number }[]
  appointmentsByDay: { day: string; count: number }[]
  revenueByDay: { day: string; total: number; collected: number }[]
  genderData: { name: string; value: number }[]
  triageData: { name: string; value: number }[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']

const TRIAGE_COLORS: Record<string, string> = {
  EMERGENCY: '#ef4444',
  URGENT: '#f59e0b',
  SEMI_URGENT: '#eab308',
  NON_URGENT: '#10b981',
}

export function AnalyticsCharts({
  admissionsByDay,
  appointmentsByDay,
  revenueByDay,
  genderData,
  triageData,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Admissions trend */}
      <ChartCard title="Admissions (30 days)">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={admissionsByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" name="Admissions" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Appointments trend */}
      <ChartCard title="Appointments (30 days)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={appointmentsByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#10b981" name="Appointments" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Revenue */}
      <ChartCard title="Revenue (30 days)">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueByDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#3b82f6" name="Billed" />
            <Bar dataKey="collected" fill="#10b981" name="Collected" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Demographics & Triage */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ChartCard title="Patient Gender Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {genderData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="OPD by Triage Level">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={triageData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="value" name="Patients">
                {triageData.map((entry) => (
                  <Cell key={entry.name} fill={TRIAGE_COLORS[entry.name] ?? '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <h2 className="mb-4 text-base font-medium text-neutral-900">{title}</h2>
      {children}
    </div>
  )
}
