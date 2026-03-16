'use client'

import { updatePrescriptionStatusAction } from './actions'
import { btn } from '@/lib/styles'
import type { AppRole, PrescriptionStatus } from '@/types/database'
import { canPrescribe } from '@/lib/prescriptions/permissions'

interface Props {
  prescriptionId: string
  status: PrescriptionStatus
  userRole: AppRole
}

export function PrescriptionActions({ prescriptionId, status, userRole }: Props) {
  if (status !== 'ACTIVE' || !canPrescribe(userRole)) return null

  async function handleAction(newStatus: PrescriptionStatus) {
    if (!window.confirm(`Mark this prescription as ${newStatus.toLowerCase()}?`)) return
    const result = await updatePrescriptionStatusAction(prescriptionId, newStatus)
    if (result.error) alert(result.error)
  }

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => handleAction('COMPLETED')}
        className={`${btn.ghost} text-xs text-success-600`}
      >
        Complete
      </button>
      <button
        type="button"
        onClick={() => handleAction('DISCONTINUED')}
        className={`${btn.ghost} text-xs text-error-600`}
      >
        Discontinue
      </button>
    </div>
  )
}
