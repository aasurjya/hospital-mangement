import { btn } from '@/lib/styles'
import type { AppRole } from '@/types/database'

interface Action {
  label: string
  href: string
  primary?: boolean // creation actions get filled style; navigation gets outlined
}

// H5: creation actions (primary=true) are visually distinct from navigation actions
function getActions(role: AppRole): Action[] {
  switch (role) {
    case 'HOSPITAL_ADMIN':
      return [
        { label: 'Admit patient', href: '/hospital/admissions/new', primary: true },
        { label: 'New appointment', href: '/hospital/appointments/new', primary: true },
        { label: 'Register patient', href: '/hospital/patients/new', primary: true },
        { label: 'Manage staff', href: '/hospital/staff' },
        { label: 'Rooms', href: '/hospital/rooms' },
      ]
    case 'DOCTOR':
      return [
        { label: 'Admit patient', href: '/hospital/admissions/new', primary: true },
        { label: 'New appointment', href: '/hospital/appointments/new', primary: true },
        { label: 'New record', href: '/hospital/records/new', primary: true },
        { label: 'Patients', href: '/hospital/patients' },
      ]
    case 'NURSE':
      return [
        { label: 'New record', href: '/hospital/records/new', primary: true },
        { label: 'Patients', href: '/hospital/patients' },
        { label: 'Admissions', href: '/hospital/admissions' },
      ]
    case 'RECEPTIONIST':
      return [
        { label: 'Register patient', href: '/hospital/patients/new', primary: true },
        { label: 'New appointment', href: '/hospital/appointments/new', primary: true },
        { label: 'Patients', href: '/hospital/patients' },
      ]
    default:
      return [
        { label: 'Patients', href: '/hospital/patients' },
        { label: 'Appointments', href: '/hospital/appointments' },
      ]
  }
}

export function QuickActions({ role }: { role: AppRole }) {
  const actions = getActions(role)

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-neutral-900">Quick actions</h2>
      <div className="flex flex-wrap gap-2">
        {actions.map(({ label, href, primary }) => (
          <a
            key={href}
            href={href}
            className={`inline-flex min-h-[44px] items-center rounded-md px-4 text-sm font-medium transition-colors ${
              primary
                ? btn.primary
                : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
            }`}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}
