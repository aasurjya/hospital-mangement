import { HospitalForm } from './hospital-form'

export const metadata = { title: 'New Hospital | Platform Admin' }

export default function NewHospitalPage() {
  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6">
        <a href="/platform/hospitals" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Hospitals
        </a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Add hospital</h1>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <HospitalForm />
      </div>
    </div>
  )
}
