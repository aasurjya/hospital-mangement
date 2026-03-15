'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'AI Co-pilot', href: '#ai' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' },
] as const

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  const closeMobile = useCallback(() => {
    setMobileOpen(false)
    hamburgerRef.current?.focus()
  }, [])

  // Focus first mobile link when menu opens
  useEffect(() => {
    if (mobileOpen) {
      firstLinkRef.current?.focus()
    }
  }, [mobileOpen])

  // Header scroll state + progress
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      setScrolled(scrollTop > 8)
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-primary-500"
      >
        Skip to main content
      </a>

      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 ${
          scrolled
            ? 'border-neutral-200/80 bg-white/90 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_4px_12px_-2px_rgba(0,0,0,0.06)]'
            : 'border-white/40 bg-white/70 shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.6)]'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          {/* Brand */}
          <a href="/" aria-label="HospitalOS home" className="text-xl font-bold tracking-tight text-neutral-900">
            HospitalOS
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center rounded-md px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              Log in
            </Link>
            <a
              href="#contact"
              className="btn-cta rounded-lg px-5 py-2 text-sm font-medium text-white active:scale-[0.97]"
            >
              Request a Demo
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            ref={hamburgerRef}
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-neutral-600 hover:bg-neutral-100 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-landing-nav"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu — always in DOM for transition */}
        <nav
          id="mobile-landing-nav"
          className="overflow-hidden border-t border-neutral-200 bg-white px-4 transition-all duration-200 ease-out md:hidden"
          style={{
            maxHeight: mobileOpen ? '400px' : '0',
            paddingBottom: mobileOpen ? '24px' : '0',
            paddingTop: mobileOpen ? '16px' : '0',
            opacity: mobileOpen ? 1 : 0,
          }}
          aria-label="Mobile navigation"
          aria-hidden={!mobileOpen}
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link, index) => (
              <li key={link.href}>
                <a
                  ref={index === 0 ? firstLinkRef : undefined}
                  href={link.href}
                  onClick={closeMobile}
                  tabIndex={mobileOpen ? 0 : -1}
                  className="block rounded-md px-3 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4">
            <Link
              href="/login"
              onClick={closeMobile}
              tabIndex={mobileOpen ? 0 : -1}
              className="rounded-md px-3 py-3 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              Log in
            </Link>
            <a
              href="#contact"
              onClick={closeMobile}
              tabIndex={mobileOpen ? 0 : -1}
              className="rounded-lg bg-primary-600 px-3 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-primary-700 active:scale-[0.97]"
            >
              Request a Demo
            </a>
          </div>
        </nav>

        {/* Scroll progress bar */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-primary-500 to-secondary-500 transition-[width] duration-100"
          style={{ width: `${scrollProgress}%` }}
          aria-hidden="true"
        />
      </header>
    </>
  )
}
