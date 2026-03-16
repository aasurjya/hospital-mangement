'use client'

import { useActionState } from 'react'
import { updatePatientProfileAction, type ProfileActionState } from './actions'
import { input, btn, alert, card } from '@/lib/styles'

interface Props {
  initialData: {
    phone: string
    email: string
    address: string
    emergency_contact_name: string
    emergency_contact_phone: string
  }
}

export function EditProfileForm({ initialData }: Props) {
  const [state, formAction, isPending] = useActionState<ProfileActionState, FormData>(
    updatePatientProfileAction, null
  )

  return (
    <div className={card.base}>
      <h2 className="text-base font-semibold text-neutral-900 mb-4">Contact Information</h2>

      {state?.status === 'success' && (
        <div role="status" aria-live="polite" className={`mb-4 ${alert.success}`}>
          Contact information updated.
        </div>
      )}
      {state?.status === 'error' && (
        <div role="alert" className={`mb-4 ${alert.error}`}>{state.error}</div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className={input.label}>Phone</label>
            <input id="phone" name="phone" type="tel" defaultValue={initialData.phone}
              disabled={isPending} className={input.base} />
          </div>
          <div>
            <label htmlFor="email" className={input.label}>Email</label>
            <input id="email" name="email" type="email" defaultValue={initialData.email}
              disabled={isPending} className={input.base} />
          </div>
        </div>

        <div>
          <label htmlFor="address" className={input.label}>Address</label>
          <input id="address" name="address" type="text" defaultValue={initialData.address}
            disabled={isPending} className={input.base} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="emergency_contact_name" className={input.label}>Emergency Contact Name</label>
            <input id="emergency_contact_name" name="emergency_contact_name" type="text"
              defaultValue={initialData.emergency_contact_name} disabled={isPending} className={input.base} />
          </div>
          <div>
            <label htmlFor="emergency_contact_phone" className={input.label}>Emergency Contact Phone</label>
            <input id="emergency_contact_phone" name="emergency_contact_phone" type="tel"
              defaultValue={initialData.emergency_contact_phone} disabled={isPending} className={input.base} />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={isPending} className={btn.primary}>
            {isPending ? 'Saving\u2026' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
