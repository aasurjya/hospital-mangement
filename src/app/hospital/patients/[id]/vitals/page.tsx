import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/rbac/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { canWriteVitals } from '@/lib/clinical/permissions'
import { VitalsForm } from './vitals-form'

export const metadata = { title: 'Vital Signs' }

export default async function PatientVitalsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { profile } = await requireAuth()
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const [{ data: patient }, { data: vitals }] = await Promise.all([
    supabase.from('patients').select('id, full_name, mrn').eq('id', id).eq('hospital_id', profile.hospital_id!).single(),
    supabase.from('vital_signs').select('*').eq('patient_id', id).order('recorded_at', { ascending: false }).limit(20),
  ])

  if (!patient) notFound()

  const canWrite = canWriteVitals(profile.role)
  const latest = vitals?.[0] ?? null

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div>
        <a href={`/hospital/patients/${id}`} className="text-sm text-neutral-500 hover:text-neutral-700">
          ← {patient.full_name}
        </a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Vital Signs</h1>
        <p className="text-sm text-neutral-500">{patient.mrn}</p>
      </div>

      {/* Latest vitals summary */}
      {latest && (
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-medium text-neutral-500">Latest Reading</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <VitalCard label="Blood Pressure" value={latest.systolic_bp && latest.diastolic_bp ? `${latest.systolic_bp}/${latest.diastolic_bp}` : null} unit="mmHg" />
            <VitalCard label="Heart Rate" value={latest.heart_rate} unit="bpm" />
            <VitalCard label="Temperature" value={latest.temperature} unit="°C" />
            <VitalCard label="SpO2" value={latest.o2_saturation} unit="%" />
            <VitalCard label="Respiratory Rate" value={latest.respiratory_rate} unit="/min" />
            <VitalCard label="Weight" value={latest.weight_kg} unit="kg" />
            <VitalCard label="Height" value={latest.height_cm} unit="cm" />
            <VitalCard label="BMI" value={latest.bmi} unit="" />
            <VitalCard label="Pain Scale" value={latest.pain_scale} unit="/10" />
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            Recorded {new Date(latest.recorded_at).toLocaleString()}
          </p>
        </div>
      )}

      {canWrite && <VitalsForm patientId={id} />}

      {/* History table */}
      <div>
        <h2 className="mb-2 text-base font-medium text-neutral-900">History</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm" aria-label="Vital signs history">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-neutral-500">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-neutral-500">BP</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-neutral-500">HR</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-neutral-500">Temp</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-neutral-500">SpO2</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-neutral-500">RR</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-neutral-500">Pain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {(!vitals || vitals.length === 0) && (
                <tr><td colSpan={7} className="px-3 py-4 text-center text-neutral-400">No vital signs recorded.</td></tr>
              )}
              {vitals?.map((v) => (
                <tr key={v.id} className="hover:bg-neutral-50">
                  <td className="px-3 py-2 whitespace-nowrap text-neutral-700">{new Date(v.recorded_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{v.systolic_bp && v.diastolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : '—'}</td>
                  <td className="px-3 py-2">{v.heart_rate ?? '—'}</td>
                  <td className="px-3 py-2">{v.temperature ? `${v.temperature}°C` : '—'}</td>
                  <td className="px-3 py-2">{v.o2_saturation ? `${v.o2_saturation}%` : '—'}</td>
                  <td className="px-3 py-2">{v.respiratory_rate ?? '—'}</td>
                  <td className="px-3 py-2">{v.pain_scale !== null ? `${v.pain_scale}/10` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function VitalCard({ label, value, unit }: { label: string; value: string | number | null; unit: string }) {
  return (
    <div className="rounded-md bg-neutral-50 p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-neutral-900">
        {value !== null && value !== undefined ? `${value}${unit ? ` ${unit}` : ''}` : '—'}
      </p>
    </div>
  )
}
