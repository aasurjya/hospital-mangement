'use client'

import { useActionState, useState } from 'react'
import { createInvoiceAction, type InvoiceFormState } from '../actions'

interface LineItem {
  description: string
  quantity: string
  unit_price: string
}

interface Props {
  patients: { id: string; full_name: string; mrn: string }[]
  admissions: { id: string; patient_id: string; reason: string | null; admitted_at: string }[]
  appointments: { id: string; patient_id: string; reason: string | null; scheduled_at: string }[]
  preselectedPatient: { id: string; full_name: string; mrn: string } | null
}

const emptyItem = (): LineItem => ({ description: '', quantity: '1', unit_price: '' })

export function NewInvoiceForm({ patients, admissions, appointments, preselectedPatient }: Props) {
  const [state, formAction, isPending] = useActionState<InvoiceFormState, FormData>(
    createInvoiceAction, null
  )

  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient)
  const [showDropdown, setShowDropdown] = useState(false)
  const [items, setItems] = useState<LineItem[]>([emptyItem()])
  const [taxRate, setTaxRate] = useState('0')

  const filtered = patientSearch.length >= 1
    ? patients.filter(
        (p) =>
          p.full_name.toLowerCase().includes(patientSearch.toLowerCase()) ||
          p.mrn.toLowerCase().includes(patientSearch.toLowerCase())
      ).slice(0, 10)
    : []

  const patientAdmissions = selectedPatient
    ? admissions.filter((a) => a.patient_id === selectedPatient.id)
    : []
  const patientAppointments = selectedPatient
    ? appointments.filter((a) => a.patient_id === selectedPatient.id)
    : []

  // Live totals
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    return sum + qty * price
  }, 0)
  const taxRateNum = parseFloat(taxRate) || 0
  const taxAmount = Math.round(subtotal * (taxRateNum / 100) * 100) / 100
  const total = Math.round((subtotal + taxAmount) * 100) / 100

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <form action={formAction} className="space-y-5">
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
              <button type="button"
                onClick={() => { setSelectedPatient(null); setPatientSearch('') }}
                className="min-h-[44px] px-3 text-sm text-neutral-600 hover:text-neutral-800"
                aria-label="Change selected patient">
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
                  <button type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setSelectedPatient(p); setShowDropdown(false); setPatientSearch('') }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-primary-50 focus:bg-primary-50">
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
          <input type="hidden" name="patient_id" value="" />
        </div>
      )}

      {/* Optional links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {patientAdmissions.length > 0 && (
          <div>
            <label htmlFor="admission_id" className="block text-sm font-medium text-neutral-700">
              Admission <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <select id="admission_id" name="admission_id" className={inputCls}>
              <option value="">None</option>
              {patientAdmissions.map((a) => (
                <option key={a.id} value={a.id}>
                  {new Date(a.admitted_at).toLocaleDateString()} — {a.reason ?? 'No reason'}
                </option>
              ))}
            </select>
          </div>
        )}
        {patientAppointments.length > 0 && (
          <div>
            <label htmlFor="appointment_id" className="block text-sm font-medium text-neutral-700">
              Appointment <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <select id="appointment_id" name="appointment_id" className={inputCls}>
              <option value="">None</option>
              {patientAppointments.map((a) => (
                <option key={a.id} value={a.id}>
                  {new Date(a.scheduled_at).toLocaleDateString()} — {a.reason ?? 'No reason'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-neutral-700">
            Due date <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <input id="due_date" name="due_date" type="date" className={inputCls} />
        </div>
        <div>
          <label htmlFor="tax_rate" className="block text-sm font-medium text-neutral-700">
            Tax rate (%) <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <input id="tax_rate" name="tax_rate" type="number" step="0.01" min="0" max="100"
            value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Line items */}
      <fieldset>
        <legend className="block text-sm font-medium text-neutral-700 mb-2">
          Line items <span className="text-error-500" aria-hidden="true">*</span>
        </legend>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start" role="group" aria-label={`Line item ${i + 1}`}>
              <div className="flex-1">
                <label htmlFor={`item-desc-${i}`} className="sr-only">Item {i + 1} description</label>
                <input
                  id={`item-desc-${i}`}
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div className="w-20">
                <label htmlFor={`item-qty-${i}`} className="sr-only">Item {i + 1} quantity</label>
                <input
                  id={`item-qty-${i}`}
                  placeholder="Qty"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div className="w-28">
                <label htmlFor={`item-price-${i}`} className="sr-only">Item {i + 1} unit price</label>
                <input
                  id={`item-price-${i}`}
                  placeholder="Unit price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
              <div className="w-24 mt-1 text-right text-sm font-mono text-neutral-700 pt-2" aria-label={`Item ${i + 1} total`}>
                {((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
              </div>
              <button type="button" onClick={() => removeItem(i)}
                disabled={items.length <= 1}
                className="mt-1 min-h-[44px] px-2 text-neutral-400 hover:text-error-600 disabled:opacity-30"
                aria-label={`Remove item ${i + 1}`}>
                &times;
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem}
          className="mt-2 min-h-[44px] text-sm font-medium text-primary-600 hover:text-primary-800">
          + Add item
        </button>
      </fieldset>

      {/* Totals */}
      <div className="rounded-md bg-neutral-50 border border-neutral-200 p-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">Subtotal</span>
          <span className="font-mono">{subtotal.toFixed(2)}</span>
        </div>
        {taxRateNum > 0 && (
          <div className="flex justify-between">
            <span className="text-neutral-600">Tax ({taxRateNum}%)</span>
            <span className="font-mono">{taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-medium text-neutral-900 border-t border-neutral-200 pt-1">
          <span>Total</span>
          <span className="font-mono">{total.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-neutral-700">
          Notes <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <textarea id="notes" name="notes" rows={2} className={inputCls} />
      </div>

      {/* Hidden JSON field for items */}
      <input type="hidden" name="items_json" value={JSON.stringify(
        items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
        }))
      )} />

      <div className="flex gap-3 pt-4">
        <button type="submit" disabled={isPending}
          className="rounded-md bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors">
          {isPending ? 'Creating...' : 'Create invoice'}
        </button>
        <a href="/hospital/billing" className="inline-flex items-center min-h-[44px] px-3 text-sm text-neutral-600 hover:text-neutral-800">Cancel</a>
      </div>
    </form>
  )
}

const inputCls = 'mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50'
