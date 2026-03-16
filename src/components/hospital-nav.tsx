'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface NavItem {
  label: string
  href: string
  adminOnly?: boolean
  staffOnly?: boolean
  doctorOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/hospital' },
  { label: 'Patients', href: '/hospital/patients', staffOnly: true },
  { label: 'Appointments', href: '/hospital/appointments', staffOnly: true },
  { label: 'Admissions', href: '/hospital/admissions', staffOnly: true },
  { label: 'Records', href: '/hospital/records', staffOnly: true },
  { label: 'Billing', href: '/hospital/billing', staffOnly: true },
  { label: 'Chat', href: '/hospital/chat', staffOnly: true },
  { label: 'AI Assistant', href: '/hospital/ai', doctorOnly: true },
  { label: 'Reports', href: '/hospital/reports', adminOnly: true },
  { label: 'Staff', href: '/hospital/staff', adminOnly: true },
  { label: 'Departments', href: '/hospital/departments', adminOnly: true },
  { label: 'Rooms', href: '/hospital/rooms', staffOnly: true },
]

interface Props {
  userFullName: string
  userRole: string
  isAdmin: boolean
  isPatient: boolean
}

function formatRole(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function HospitalNav({ userFullName, userRole, isAdmin, isPatient }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  // Return focus to hamburger when mobile menu closes
  useEffect(() => {
    if (!mobileOpen) {
      hamburgerRef.current?.focus()
    }
  }, [mobileOpen])

  const closeMobileMenu = useCallback(() => setMobileOpen(false), [])

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.doctorOnly && userRole !== 'DOCTOR') return false
    if (item.staffOnly && isPatient) return false
    return true
  })

  const isActive = (href: string) => {
    if (href === '/hospital') return pathname === '/hospital'
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
          {/* Brand + hamburger */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Hamburger button — mobile only */}
            <button
              ref={hamburgerRef}
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              aria-haspopup="true"
              aria-controls="mobile-nav"
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

            <Link
              href="/hospital"
              className="text-base font-bold text-primary-700 hover:text-primary-800"
            >
              HospitalOS
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {visibleItems.map((item) => (
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

          {/* User info + logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-neutral-900 leading-tight">
                {userFullName}
              </span>
              <span className="text-xs text-neutral-600 leading-tight">
                {formatRole(userRole)}
              </span>
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

        {/* Mobile nav panel */}
        {mobileOpen && (
          <nav
            id="mobile-nav"
            className="border-t border-neutral-200 bg-white px-4 pb-4 pt-2 md:hidden"
            aria-label="Mobile navigation"
          >
            <ul className="flex flex-col gap-1">
              {visibleItems.map((item) => (
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

            {/* User info in mobile menu (visible below sm) */}
            <div className="mt-3 border-t border-neutral-100 pt-3 sm:hidden">
              <p className="px-3 text-sm font-medium text-neutral-900">{userFullName}</p>
              <p className="px-3 text-xs text-neutral-600">{formatRole(userRole)}</p>
            </div>
          </nav>
        )}
      </header>
    </>
  )
}
