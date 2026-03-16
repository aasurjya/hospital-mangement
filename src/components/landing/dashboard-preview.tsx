'use client'

import { useRef, useState } from 'react'
import { ScrollReveal } from './scroll-reveal'

const SCREENS = [
  {
    title: 'Dashboard',
    description: 'Real-time overview of patients, admissions, appointments, and staff activity.',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Active Patients', value: '342' },
            { label: "Today's Appts", value: '28' },
            { label: 'Admissions', value: '12' },
            { label: 'Available Beds', value: '45' },
          ].map((stat) => (
            <div key={stat.label} className="rounded p-3" style={{ backgroundColor: '#F0EDE6' }}>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em]" style={{ color: '#9B9589' }}>{stat.label}</p>
              <p className="text-2xl font-medium" style={{ color: '#131313' }}>{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded p-4" style={{ border: '1px solid #E8E3DC' }}>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: '#9B9589' }}>Patient Admissions — Last 7 Days</p>
          <div className="flex items-end gap-2" style={{ height: '64px' }}>
            {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: '#96C4C8' }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between" style={{ fontSize: '9px', color: '#9B9589' }}>
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { name: 'Dr. Smith admitted patient MRN-2026-A1B2C3D4', time: '2m ago' },
            { name: 'Nurse Patel updated vitals for Room 204', time: '5m ago' },
            { name: 'New appointment scheduled — Dr. Chen', time: '8m ago' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded px-3 py-2" style={{ backgroundColor: '#F0EDE6' }}>
              <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: '#96C4C8' }} />
              <p className="flex-1 truncate text-xs" style={{ color: '#131313' }}>{item.name}</p>
              <span className="shrink-0 text-[10px]" style={{ color: '#9B9589' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Patients',
    description: 'Complete patient profiles with MRN, demographics, history, and quick search.',
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded px-3 py-2.5" style={{ border: '1px solid #E8E3DC', backgroundColor: '#F9F8F5' }}>
          <svg className="h-3.5 w-3.5" style={{ color: '#9B9589' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <span className="text-xs" style={{ color: '#9B9589' }}>Search patients by name or MRN...</span>
        </div>
        <div className="divide-y rounded" style={{ border: '1px solid #E8E3DC', borderColor: '#E8E3DC' }}>
          {[
            { name: 'Sarah Johnson', mrn: 'MRN-2026-A1B2', age: '34 F', status: 'Admitted' },
            { name: 'James Williams', mrn: 'MRN-2026-E5F6', age: '67 M', status: 'Outpatient' },
            { name: 'Maria Garcia', mrn: 'MRN-2026-I9J0', age: '45 F', status: 'Admitted' },
            { name: 'Robert Chen', mrn: 'MRN-2026-M3N4', age: '52 M', status: 'Discharged' },
          ].map((p) => (
            <div key={p.mrn} className="flex items-center gap-3 px-3 py-2.5" style={{ borderColor: '#E8E3DC' }}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium" style={{ backgroundColor: 'rgba(149,196,200,0.15)', color: '#96C4C8' }}>
                {p.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium" style={{ color: '#131313' }}>{p.name}</p>
                <p className="text-[10px]" style={{ color: '#9B9589' }}>{p.mrn} · {p.age}</p>
              </div>
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: '#9B9589' }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Appointments',
    description: 'Book, track, and manage appointments with real-time status updates.',
    content: (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.08em]" style={{ color: '#131313' }}>March 2026</p>
          <div className="rounded px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em]" style={{ backgroundColor: '#F0EDE6', color: '#9B9589' }}>Today</div>
        </div>
        <div className="space-y-2">
          {[
            { time: '09:00', patient: 'Sarah Johnson', doctor: 'Dr. Smith', status: 'Confirmed' },
            { time: '10:30', patient: 'James Williams', doctor: 'Dr. Chen', status: 'Scheduled' },
            { time: '11:00', patient: 'Maria Garcia', doctor: 'Dr. Patel', status: 'In Progress' },
            { time: '14:00', patient: 'Robert Chen', doctor: 'Dr. Smith', status: 'Scheduled' },
          ].map((slot) => (
            <div key={slot.time + slot.patient} className="flex items-center gap-3 rounded px-3 py-2.5" style={{ border: '1px solid #E8E3DC' }}>
              <span className="shrink-0 text-[10px] font-medium" style={{ color: '#9B9589', width: '36px' }}>{slot.time}</span>
              <div className="flex-1">
                <p className="text-xs font-medium" style={{ color: '#131313' }}>{slot.patient}</p>
                <p className="text-[10px]" style={{ color: '#9B9589' }}>{slot.doctor}</p>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: slot.status === 'In Progress' ? '#96C4C8' : '#9B9589' }}>{slot.status}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Chat',
    description: 'Secure messaging between staff — direct, group, and broadcast channels.',
    content: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: '#E8E3DC' }}>
          <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium" style={{ backgroundColor: 'rgba(149,196,200,0.15)', color: '#96C4C8' }}>IC</div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.06em]" style={{ color: '#131313' }}>ICU Team</p>
            <p className="text-[10px]" style={{ color: '#96C4C8' }}>4 members online</p>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-medium" style={{ backgroundColor: '#F0EDE6', color: '#131313' }}>DS</div>
            <div className="rounded-r rounded-bl px-3 py-2" style={{ backgroundColor: '#F0EDE6' }}>
              <p className="text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: '#9B9589' }}>Dr. Smith</p>
              <p className="text-xs" style={{ color: '#131313' }}>Patient in Room 204 needs a CBC panel ordered. Elevated temp since 6am.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-medium" style={{ backgroundColor: '#F0EDE6', color: '#131313' }}>NP</div>
            <div className="rounded-r rounded-bl px-3 py-2" style={{ backgroundColor: '#F0EDE6' }}>
              <p className="text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: '#9B9589' }}>Nurse Patel</p>
              <p className="text-xs" style={{ color: '#131313' }}>On it. Current temp is 38.6°C. I&apos;ll draw labs now.</p>
            </div>
          </div>
          <div className="flex flex-row-reverse gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-medium" style={{ backgroundColor: 'rgba(149,196,200,0.15)', color: '#96C4C8' }}>You</div>
            <div className="rounded-l rounded-br px-3 py-2" style={{ backgroundColor: '#131313' }}>
              <p className="text-xs" style={{ color: 'rgba(249,248,245,0.9)' }}>I&apos;ll review the results as soon as they&apos;re in. Thanks team.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded px-3 py-2" style={{ border: '1px solid #E8E3DC' }}>
          <span className="flex-1 text-xs" style={{ color: '#9B9589' }}>Type a message...</span>
          <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: '#131313' }}>
            <svg className="h-3 w-3" style={{ color: '#F9F8F5' }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Records',
    description: 'Structured clinical notes with DRAFT → FINALIZED workflow for data integrity.',
    content: (
      <div className="space-y-3">
        <div className="rounded p-4" style={{ border: '1px solid #E8E3DC' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.06em]" style={{ color: '#131313' }}>Clinical Note — Sarah Johnson</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#9B9589' }}>MRN-2026-A1B2 · Dr. Smith · March 15, 2026</p>
            </div>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]" style={{ backgroundColor: 'rgba(217,211,201,0.3)', color: '#9B9589' }}>Draft</span>
          </div>
          <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: '#E8E3DC' }}>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: '#9B9589' }}>Chief Complaint</p>
              <p className="text-xs mt-0.5" style={{ color: '#131313' }}>Persistent fever and fatigue for 3 days</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: '#9B9589' }}>Assessment</p>
              <p className="text-xs mt-0.5" style={{ color: '#131313' }}>Suspected UTI, pending culture results. CBC shows elevated WBC at 14,200.</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: '#9B9589' }}>Plan</p>
              <p className="text-xs mt-0.5" style={{ color: '#131313' }}>Start empiric antibiotics. Follow-up culture in 48h. Monitor temp q4h.</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="rounded px-3 py-1 text-[10px] font-medium uppercase tracking-[0.06em]" style={{ backgroundColor: '#131313', color: '#F9F8F5' }}>Finalize</div>
            <div className="rounded px-3 py-1 text-[10px] font-medium uppercase tracking-[0.06em]" style={{ border: '1px solid #E8E3DC', color: '#9B9589' }}>Edit</div>
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
    <section
      className="px-6 py-24 lg:px-12 lg:py-36"
      style={{ backgroundColor: 'var(--cream)', borderTop: '1px solid var(--sand)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1400px]">
        <ScrollReveal animation="fade-up">
          <div className="mb-16">
            <p className="section-label mb-3">Product tour</p>
            <h2
              className="font-sans font-medium uppercase leading-[0.95] tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 5.5rem)', color: 'var(--ink)' }}
            >
              Every screen<br />
              <span className="font-display italic font-light" style={{ fontSize: '0.9em' }}>built for clinical speed</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={100}>
          <div className="mx-auto max-w-4xl">
            {/* Tab bar */}
            <div
              ref={tablistRef}
              className="flex gap-1 overflow-x-auto p-1"
              style={{ backgroundColor: 'var(--cream-2)', border: '1px solid var(--sand)', borderBottom: 'none', borderRadius: '2px 2px 0 0' }}
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
                  className="flex items-center gap-2 whitespace-nowrap rounded px-4 py-2 transition-all duration-200"
                  style={{
                    backgroundColor: index === activeTab ? 'var(--cream)' : 'transparent',
                    color: index === activeTab ? 'var(--ink)' : 'var(--sand)',
                    fontSize: '0.625rem',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={TAB_ICONS[index]} />
                  </svg>
                  <span className="hidden sm:inline">{screen.title}</span>
                </button>
              ))}
            </div>

            {/* Browser chrome URL bar */}
            <div
              className="flex items-center gap-3 px-4 py-2"
              style={{ borderLeft: '1px solid var(--sand)', borderRight: '1px solid var(--sand)', backgroundColor: 'var(--cream-2)' }}
            >
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--sand)' }} />
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--sand)' }} />
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--sand)' }} />
              </div>
              <div
                className="flex-1 rounded px-3 py-1"
                style={{ border: '1px solid var(--sand)', fontSize: '10px', color: 'var(--sand)', fontWeight: 500, letterSpacing: '0.06em', fontFamily: 'monospace' }}
              >
                hospitalos.com{ROUTES[activeTab]}
              </div>
            </div>

            {/* Content panel */}
            <div
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              tabIndex={0}
              className="relative overflow-hidden"
              style={{
                border: '1px solid var(--sand)',
                borderTop: 'none',
                backgroundColor: '#F9F8F5',
                minHeight: '360px',
                borderRadius: '0 0 2px 2px',
              }}
            >
              <div
                key={activeTab}
                className={`p-6 ${direction === 'forward' ? 'animate-tab-enter-forward' : 'animate-tab-enter-back'}`}
              >
                {activeScreen.content}
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3
                className="font-sans text-sm font-medium uppercase tracking-[0.06em]"
                style={{ color: 'var(--ink)' }}
              >
                {activeScreen.title}
              </h3>
              <p
                className="mt-1 text-xs font-medium uppercase tracking-[0.05em]"
                style={{ color: 'var(--sand)' }}
              >
                {activeScreen.description}
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
