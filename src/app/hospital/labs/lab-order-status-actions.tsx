'use client'

import { updateLabOrderStatusAction } from './actions'
import { btn } from '@/lib/styles'
import type { LabOrderStatus } from '@/types/database'

interface Props {
  orderId: string
  status: LabOrderStatus
}

export function LabOrderStatusActions({ orderId, status }: Props) {
  async function handleUpdate(newStatus: LabOrderStatus) {
    const result = await updateLabOrderStatusAction(orderId, newStatus)
    if (result.error) alert(result.error)
  }

  if (status === 'ORDERED') {
    return (
      <button type="button" onClick={() => handleUpdate('SAMPLE_COLLECTED')} className={`${btn.ghost} text-xs text-primary-600`}>
        Collect Sample
      </button>
    )
  }
  if (status === 'SAMPLE_COLLECTED') {
    return (
      <button type="button" onClick={() => handleUpdate('PROCESSING')} className={`${btn.ghost} text-xs text-primary-600`}>
        Start Processing
      </button>
    )
  }
  return null
}
