'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/patient/dashboard' },
  { label: 'Appointments', href: '/patient/appointments' },
  { label: 'Admissions', href: '/patient/admissions' },
  { label: 'Records', href: '/patient/records' },
  { label: 'Billing', href: '/patient/billing' },
  { label: 'Chat', href: '/patient/chat' },
  { label: 'History', href: '/patient/history' },
  { label: 'Feedback', href: '/patient/feedback' },
  { label: 'Documents', href: '/patient/documents' },
  { label: 'Profile', href: '/patient/profile' },
]

interface Props {
  patientName: string
}

export function PatientNav({ patientName }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!mobileOpen) hamburgerRef.current?.focus()
  }, [mobileOpen])

  const closeMobileMenu = useCallback(() => setMobileOpen(false), [])

  const isActive = (href: string) => {
    if (href === '/patient/dashboard') return pathname === '/patient/dashboard' || pathname === '/patient'
    return pathname.startsWith(href)
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-primary-500"
      >
        Skip to main content
      </a>

      <header className="fixed top-0 left-0 right-0 z-40 border-b border-neutral-200 bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              ref={hamburgerRef}
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              aria-haspopup="true"
              aria-controls="patient-mobile-nav"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>

            <Link href="/patient/dashboard" className="text-base font-bold text-primary-700 hover:text-primary-800">
              MyHealth
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Patient navigation">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-neutral-900 leading-tight">{patientName}</span>
              <span className="text-xs text-neutral-600 leading-tight">Patient</span>
            </div>
            <form method="POST" action="/api/auth/logout">
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:border-neutral-400 hover:text-neutral-800 transition-colors"
              >
                Logout
              </button>
            </form>
          </div>
        </div>

        {mobileOpen && (
          <nav
            id="patient-mobile-nav"
            className="border-t border-neutral-200 bg-white px-4 pb-4 pt-2 md:hidden"
            aria-label="Patient mobile navigation"
          >
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-neutral-100 pt-3 sm:hidden">
              <p className="px-3 text-sm font-medium text-neutral-900">{patientName}</p>
              <p className="px-3 text-xs text-neutral-600">Patient</p>
            </div>
          </nav>
        )}
      </header>
    </>
  )
}
