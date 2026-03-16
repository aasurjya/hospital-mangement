import { requireRoles } from '@/lib/rbac/guards'
import { FORMULARY_MANAGEMENT_ROLES } from '@/lib/prescriptions/permissions'
import { FormularyForm } from './formulary-form'

export const metadata = { title: 'Add Drug to Formulary' }

export default async function NewFormularyPage() {
  await requireRoles(FORMULARY_MANAGEMENT_ROLES)

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <a href="/hospital/formulary" className="text-sm text-neutral-500 hover:text-neutral-700">← Formulary</a>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Add Drug</h1>
      </div>
      <FormularyForm />
    </div>
  )
}
