'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  userFullName: string
}

export function PlatformNav({ userFullName }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/platform') return pathname === '/platform'
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
          {/* Brand */}
          <Link
            href="/platform/hospitals"
            className="text-base font-bold text-primary-700 hover:text-primary-800"
          >
            HospitalOS
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <Link
              href="/platform/hospitals"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive('/platform/hospitals')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              Hospitals
            </Link>
          </nav>

          {/* User info + logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-neutral-900 leading-tight">
                {userFullName}
              </span>
              <span className="text-xs text-neutral-400 leading-tight">
                Platform Admin
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
      </header>
    </>
  )
}
