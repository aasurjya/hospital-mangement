'use client'

import { useState, useTransition } from 'react'
import { cancelAppointmentAction } from './actions'

export function AppointmentCancelButton({ appointmentId }: { appointmentId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleCancel() {
    if (!confirm('Cancel this appointment?')) return
    startTransition(async () => {
      const result = await cancelAppointmentAction(appointmentId)
      if (result?.status === 'error') setError(result.error)
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="text-sm text-error-600 hover:text-error-800 disabled:opacity-50 min-h-[44px]"
      >
        {isPending ? 'Cancelling\u2026' : 'Cancel'}
      </button>
      {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
    </div>
  )
}
