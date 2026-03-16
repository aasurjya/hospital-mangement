'use client'

import { dispenseMedicationAction, administerMedicationAction } from '../actions'
import { canDispense, canAdminister } from '@/lib/prescriptions/permissions'
import { btn } from '@/lib/styles'
import type { AppRole, MedicationOrderStatus } from '@/types/database'

interface Props {
  orderId: string
  status: MedicationOrderStatus
  userRole: AppRole
}

export function MedicationOrderActions({ orderId, status, userRole }: Props) {
  async function handleDispense() {
    if (!window.confirm('Dispense this medication?')) return
    const result = await dispenseMedicationAction(orderId)
    if (result.error) alert(result.error)
  }

  async function handleAdminister() {
    if (!window.confirm('Mark this medication as administered?')) return
    const result = await administerMedicationAction(orderId)
    if (result.error) alert(result.error)
  }

  if (status === 'ORDERED' && canDispense(userRole)) {
    return (
      <button type="button" onClick={handleDispense} className={`${btn.ghost} text-xs text-primary-600`}>
        Dispense
      </button>
    )
  }

  if (status === 'DISPENSED' && canAdminister(userRole)) {
    return (
      <button type="button" onClick={handleAdminister} className={`${btn.ghost} text-xs text-success-600`}>
        Administer
      </button>
    )
  }

  return null
}
