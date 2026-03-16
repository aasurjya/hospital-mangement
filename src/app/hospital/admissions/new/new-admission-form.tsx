'use client'

import { useActionState, useState } from 'react'
import { createAdmissionAction, type AdmissionState } from '../actions'
import { formatLabel } from '@/lib/format'

interface Props {
  doctors: { id: string; full_name: string }[]
  departments: { id: string; name: string }[]
  rooms: { id: string; room_number: string; room_type: string; floor: string | null }[]
  patients: { id: string; full_name: string; mrn: string }[]
  preselectedPatient: { id: string; full_name: string; mrn: string } | null
}

export function NewAdmissionForm({ doctors, departments, rooms, patients, preselectedPatient }: Props) {
  const [state, formAction, isPending] = useActionState<AdmissionState, FormData>(
    createAdmissionAction, null
  )

  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient)
  const [showDropdown, setShowDropdown] = useState(false)

  const filtered = patientSearch.length >= 1
    ? patients.filter(
        (p) =>
          p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
          p.mrn.toLowerCase().includes(patientSearch.toLowerCase())
      ).slice(0, 10)
    : []

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div role="alert" className="rounded-md bg-error-50 p-3 text-sm text-error-700 border border-error-200">{state.error}</div>
      )}

      {/* Patient selector */}
      {selectedPatient ? (
        <div>
          <label className="block text-sm font-medium text-neutral-700">Patient <span className="text-error-500" aria-hidden="true">*</span></label>
          <div className="mt-1 flex items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900">
            <span>
              {selectedPatient.full_name} <span className="text-neutral-600">({selectedPatient.mrn})</span>
            </span>
            {!preselectedPatient && (
              <button
                type="button"
                onClick={() => { setSelectedPatient(null); setPatientSearch('') }}
                className="min-h-[44px] px-3 text-sm text-neutral-600 hover:text-neutral-800"
                aria-label="Change selected patient"
              >
                Change
              </button>
            )}
          </div>
          <input type="hidden" name="patient_id" value={selectedPatient.id} />
        </div>
      ) : (
        <div className="relative">
          <label htmlFor="patient_search" className="block text-sm font-medium text-neutral-700">
            Patient <span className="text-error-500" aria-hidden="true">*</span>
          </label>
          <input
            id="patient_search"
            type="text"
            role="combobox"
            aria-expanded={showDropdown && filtered.length > 0}
            aria-haspopup="listbox"
            aria-controls="patient-listbox"
            aria-autocomplete="list"
            aria-required="true"
            value={patientSearch}
            onChange={(e) => { setPatientSearch(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search by name or MRN..."
            autoComplete="off"
            className={inputCls}
          />
          {state?.fieldErrors?.patient_id?.[0] && (
            <p className="mt-1 text-xs text-error-600">{state.fieldErrors.patient_id[0]}</p>
          )}
          {showDropdown && filtered.length > 0 && (
            <ul id="patient-listbox" role="listbox" aria-label="Patient search results"
                className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-neutral-200 bg-white shadow-lg">
              {filtered.map((p) => (
                <li key={p.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setSelectedPatient(p); setShowDropdown(false); setPatientSearch('') }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 focus:bg-primary-50"
                  >
                    <span className="font-medium text-neutral-900">{p.full_name}</span>{' '}
                    <span className="text-neutral-600">{p.mrn}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {showDropdown && patientSearch.length >= 1 && filtered.length === 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-600 shadow-lg">
              No patients found.
            </div>
          )}
          {/* Hidden required field for form validation */}
          <input type="hidden" name="patient_id" value="" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="department_id" className="block text-sm font-medium text-neutral-700">
            Department <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <select id="department_id" name="department_id" disabled={isPending} className={inputCls}>
            <option value="">None</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="doctor_id" className="block text-sm font-medium text-neutral-700">
            Doctor <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <select id="doctor_id" name="doctor_id" disabled={isPending} className={inputCls}>
            <option value="">Unassigned</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="room_id" className="block text-sm font-medium text-neutral-700">
          Room <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <select id="room_id" name="room_id" disabled={isPending} className={inputCls}>
          <option value="">No room assigned</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.room_number} — {formatLabel(r.room_type)}{r.floor ? ` (Floor ${r.floor})` : ''}
            </option>
          ))}
        </select>
        {rooms.length === 0 && (
          <p className="mt-1 text-xs text-neutral-600">No rooms available. Add rooms in hospital settings.</p>
        )}
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-neutral-700">
          Reason for admission <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <input id="reason" name="reason" type="text" disabled={isPending}
          placeholder="e.g. Chest pain, post-op observation" className={inputCls} />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-neutral-700">
          Notes <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <textarea id="notes" name="notes" rows={3} disabled={isPending} className={inputCls} />
      </div>

      <div className="flex gap-3 pt-6">
        <button type="submit" disabled={isPending}
          className="rounded-md bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors">
          {isPending ? 'Admitting…' : 'Admit patient'}
        </button>
        <a href="/hospital/admissions" className="inline-flex items-center min-h-[44px] px-3 text-sm text-neutral-600 hover:text-neutral-800">Cancel</a>
      </div>
    </form>
  )
}

const inputCls = 'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'
