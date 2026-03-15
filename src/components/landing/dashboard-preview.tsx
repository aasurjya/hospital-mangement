'use client'

import { useRef, useState } from 'react'
import { ScrollReveal } from './scroll-reveal'

const SCREENS = [
  {
    title: 'Hospital Dashboard',
    description: 'Real-time overview of patients, admissions, appointments, and staff activity.',
    content: (
      <div className="space-y-4">
        {/* Top stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Active Patients', value: '342', color: 'bg-neutral-50 text-neutral-900' },
            { label: 'Today\'s Appointments', value: '28', color: 'bg-neutral-50 text-neutral-900' },
            { label: 'Admissions', value: '12', color: 'bg-neutral-50 text-neutral-900' },
            { label: 'Available Beds', value: '45', color: 'bg-neutral-50 text-neutral-900' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-lg ${stat.color} p-3`}>
              <p className="text-xs font-medium opacity-70">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
        {/* Chart placeholder */}
        <div className="rounded-lg border border-neutral-100 bg-white p-4">
          <p className="mb-3 text-xs font-semibold text-neutral-500">Patient Admissions — Last 7 Days</p>
          <div className="flex items-end gap-2" style={{ height: '80px' }}>
            {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary-500 to-primary-300 transition-all" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
        {/* Recent activity */}
        <div className="space-y-2">
          {[
            { name: 'Dr. Smith admitted patient MRN-2026-A1B2C3D4', time: '2m ago', dot: 'bg-primary-400' },
            { name: 'Nurse Patel updated vitals for Room 204', time: '5m ago', dot: 'bg-success-400' },
            { name: 'New appointment scheduled — Dr. Chen', time: '8m ago', dot: 'bg-secondary-400' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md bg-neutral-50 px-3 py-2">
              <div className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
              <p className="flex-1 truncate text-xs text-neutral-700">{item.name}</p>
              <span className="shrink-0 text-[10px] text-neutral-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Patient Management',
    description: 'Complete patient profiles with MRN, demographics, history, and quick search.',
    content: (
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
          <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span className="text-xs text-neutral-400">Search patients by name or MRN...</span>
        </div>
        {/* Patient list */}
        <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-100">
          {[
            { name: 'Sarah Johnson', mrn: 'MRN-2026-A1B2C3D4', age: '34 F', status: 'Admitted', statusColor: 'bg-primary-100 text-primary-700' },
            { name: 'James Williams', mrn: 'MRN-2026-E5F6G7H8', age: '67 M', status: 'Outpatient', statusColor: 'bg-success-100 text-success-700' },
            { name: 'Maria Garcia', mrn: 'MRN-2026-I9J0K1L2', age: '45 F', status: 'Admitted', statusColor: 'bg-primary-100 text-primary-700' },
            { name: 'Robert Chen', mrn: 'MRN-2026-M3N4O5P6', age: '52 M', status: 'Discharged', statusColor: 'bg-neutral-100 text-neutral-600' },
          ].map((p) => (
            <div key={p.mrn} className="flex items-center gap-3 px-3 py-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                {p.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-semibold text-neutral-800">{p.name}</p>
                <p className="text-[10px] text-neutral-400">{p.mrn} &middot; {p.age}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${p.statusColor}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Appointment Scheduling',
    description: 'Book, track, and manage appointments with real-time status updates.',
    content: (
      <div className="space-y-4">
        {/* Calendar header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-800">March 2026</p>
          <div className="flex gap-1">
            <div className="rounded bg-neutral-100 px-2 py-1 text-[10px] font-medium text-neutral-500">Today</div>
          </div>
        </div>
        {/* Time slots */}
        <div className="space-y-2">
          {[
            { time: '09:00', patient: 'Sarah Johnson', doctor: 'Dr. Smith', status: 'Confirmed', color: 'border-l-secondary-500 bg-secondary-50' },
            { time: '10:30', patient: 'James Williams', doctor: 'Dr. Chen', status: 'Scheduled', color: 'border-l-primary-500 bg-primary-50' },
            { time: '11:00', patient: 'Maria Garcia', doctor: 'Dr. Patel', status: 'In Progress', color: 'border-l-success-500 bg-success-50' },
            { time: '14:00', patient: 'Robert Chen', doctor: 'Dr. Smith', status: 'Scheduled', color: 'border-l-primary-500 bg-primary-50' },
            { time: '15:30', patient: 'Anna Kim', doctor: 'Dr. Chen', status: 'Scheduled', color: 'border-l-primary-500 bg-primary-50' },
          ].map((slot) => (
            <div key={slot.time + slot.patient} className={`rounded-lg border-l-4 ${slot.color} px-3 py-2`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-800">{slot.patient}</p>
                  <p className="text-[10px] text-neutral-500">{slot.doctor} &middot; {slot.time}</p>
                </div>
                <span className="text-[10px] font-medium text-neutral-600">{slot.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Real-time Chat',
    description: 'Secure messaging between staff — direct, group, and broadcast channels.',
    content: (
      <div className="flex h-full flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100 text-xs font-bold text-success-700">IC</div>
          <div>
            <p className="text-xs font-semibold text-neutral-800">ICU Team</p>
            <p className="text-[10px] text-success-600">4 members online</p>
          </div>
        </div>
        {/* Messages */}
        <div className="mt-3 flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700">DS</div>
            <div className="rounded-lg rounded-tl-none bg-neutral-100 px-3 py-2">
              <p className="text-[10px] font-medium text-neutral-500">Dr. Smith</p>
              <p className="text-xs text-neutral-800">Patient in Room 204 needs a CBC panel ordered. Elevated temp since 6am.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-100 text-[10px] font-bold text-success-700">NP</div>
            <div className="rounded-lg rounded-tl-none bg-neutral-100 px-3 py-2">
              <p className="text-[10px] font-medium text-neutral-500">Nurse Patel</p>
              <p className="text-xs text-neutral-800">On it. Current temp is 38.6C. I&apos;ll draw labs now.</p>
            </div>
          </div>
          <div className="flex flex-row-reverse gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-[10px] font-bold text-secondary-700">You</div>
            <div className="rounded-lg rounded-tr-none bg-primary-600 px-3 py-2">
              <p className="text-xs text-white">I&apos;ll review the results as soon as they&apos;re in. Thanks team.</p>
            </div>
          </div>
        </div>
        {/* Input */}
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
          <span className="flex-1 text-xs text-neutral-400">Type a message...</span>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600">
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Medical Records',
    description: 'Structured clinical notes with DRAFT → FINALIZED workflow for data integrity.',
    content: (
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-100 bg-white p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-800">Clinical Note — Sarah Johnson</p>
              <p className="text-[10px] text-neutral-400">MRN-2026-A1B2C3D4 &middot; Dr. Smith &middot; March 15, 2026</p>
            </div>
            <span className="rounded-full bg-warning-100 px-2 py-0.5 text-[10px] font-medium text-warning-700">DRAFT</span>
          </div>
          <div className="mt-3 space-y-2 border-t border-neutral-100 pt-3">
            <div>
              <p className="text-[10px] font-semibold uppercase text-neutral-500">Chief Complaint</p>
              <p className="text-xs text-neutral-700">Persistent fever and fatigue for 3 days</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-neutral-500">Assessment</p>
              <p className="text-xs text-neutral-700">Suspected UTI, pending culture results. CBC shows elevated WBC at 14,200.</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-neutral-500">Plan</p>
              <p className="text-xs text-neutral-700">Start empiric antibiotics. Follow-up culture in 48h. Monitor temp q4h.</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="rounded-md bg-success-600 px-3 py-1 text-[10px] font-medium text-white">Finalize</div>
            <div className="rounded-md border border-neutral-300 px-3 py-1 text-[10px] font-medium text-neutral-600">Edit</div>
          </div>
        </div>
      </div>
    ),
  },
] as const

const TAB_ICONS = [
  'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
  'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5',
  'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155',
  'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
] as const

const ROUTES = [
  '/hospital/dashboard',
  '/hospital/patients',
  '/hospital/appointments',
  '/hospital/chat',
  '/hospital/records',
] as const

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const tablistRef = useRef<HTMLDivElement>(null)

  function switchTab(index: number) {
    if (index === activeTab) return
    setDirection(index > activeTab ? 'forward' : 'back')
    setActiveTab(index)
  }

  function handleTabKey(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null
    if (e.key === 'ArrowRight') { e.preventDefault(); next = (index + 1) % SCREENS.length }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); next = (index - 1 + SCREENS.length) % SCREENS.length }
    else if (e.key === 'Home') { e.preventDefault(); next = 0 }
    else if (e.key === 'End') { e.preventDefault(); next = SCREENS.length - 1 }
    if (next !== null) {
      switchTab(next)
      tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')?.[next]?.focus()
    }
  }

  const activeScreen = SCREENS[activeTab]

  return (
    <section className="bg-neutral-50 py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              Product tour
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Every screen designed for clinical speed
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-500">
              Click through to see how HospitalOS handles your daily workflows — from
              dashboard overview to patient records.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="scale-up" delay={100}>
          <div className="mx-auto mt-16 max-w-4xl">
            {/* Tab bar */}
            <div
              ref={tablistRef}
              className="flex gap-1 overflow-x-auto rounded-t-xl border border-b-0 border-neutral-200 bg-neutral-100 p-1.5"
              role="tablist"
              aria-label="Product screens"
            >
              {SCREENS.map((screen, index) => (
                <button
                  key={screen.title}
                  type="button"
                  role="tab"
                  aria-selected={index === activeTab}
                  aria-controls={`panel-${index}`}
                  tabIndex={index === activeTab ? 0 : -1}
                  onClick={() => switchTab(index)}
                  onKeyDown={(e) => handleTabKey(e, index)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    index === activeTab
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700 hover:bg-white/50'
                  }`}
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={TAB_ICONS[index]} />
                  </svg>
                  <span className="hidden sm:inline">{screen.title}</span>
                </button>
              ))}
            </div>

            {/* Browser chrome URL bar */}
            <div className="flex items-center gap-3 border-x border-neutral-200 bg-neutral-50 px-4 py-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              </div>
              <div className="flex-1 rounded-md bg-white px-3 py-1 text-xs text-neutral-400 border border-neutral-200">
                hospitalos.com{ROUTES[activeTab]}
              </div>
            </div>

            {/* Content panel with directional animation */}
            <div
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              tabIndex={0}
              className="relative overflow-hidden rounded-b-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/50"
              style={{ minHeight: '400px' }}
            >
              <div
                key={activeTab}
                className={`p-6 ${direction === 'forward' ? 'animate-tab-enter-forward' : 'animate-tab-enter-back'}`}
              >
                {activeScreen.content}
              </div>
            </div>

            {/* Description below */}
            <div className="mt-6 text-center">
              <h3 className="text-lg font-semibold text-neutral-900">{activeScreen.title}</h3>
              <p className="mt-1 text-sm text-neutral-500">{activeScreen.description}</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
