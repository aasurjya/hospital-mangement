'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' },
] as const

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  const closeMobile = useCallback(() => {
    setMobileOpen(false)
    hamburgerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (mobileOpen) firstLinkRef.current?.focus()
  }, [mobileOpen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded focus:bg-[var(--cream)] focus:px-4 focus:py-2 focus:text-xs focus:font-medium focus:uppercase focus:tracking-widest focus:shadow-md"
      >
        Skip to main content
      </a>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b shadow-[0_1px_0_0_rgba(0,0,0,0.06)]' : ''
        }`}
        style={{
          borderColor: 'var(--sand)',
          backgroundColor: scrolled ? 'rgba(249,248,245,0.96)' : 'transparent',
        }}
      >
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-6 lg:px-12">
          {/* Brand */}
          <a
            href="/"
            aria-label="HospitalOS home"
            className="text-sm font-medium tracking-[0.12em] uppercase"
            style={{ color: 'var(--ink)' }}
          >
            HospitalOS<span style={{ color: 'var(--sage)' }}>.</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-10 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-medium tracking-[0.12em] uppercase transition-opacity hover:opacity-60"
                style={{ color: 'var(--ink)' }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/login"
              className="text-xs font-medium tracking-[0.12em] uppercase transition-opacity hover:opacity-60"
              style={{ color: 'var(--ink)' }}
            >
              Log in
            </Link>
            <a
              href="#contact"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 text-xs font-medium tracking-[0.1em] uppercase transition-all hover:opacity-80"
              style={{ backgroundColor: 'var(--sage)', color: 'var(--ink)' }}
            >
              Get Started
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            ref={hamburgerRef}
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            aria-haspopup="true"
            aria-controls="mobile-landing-nav"
            onClick={() => setMobileOpen((p) => !p)}
            className="relative flex h-11 w-11 items-center justify-center md:hidden"
            style={{ color: 'var(--ink)' }}
          >
            <span className={`absolute block h-[1.5px] w-5 transition-all duration-300 ${mobileOpen ? 'rotate-45' : '-translate-y-1.5'}`} style={{ background: 'var(--ink)' }} />
            <span className={`absolute block h-[1.5px] w-5 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} style={{ background: 'var(--ink)' }} />
            <span className={`absolute block h-[1.5px] w-5 transition-all duration-300 ${mobileOpen ? '-rotate-45' : 'translate-y-1.5'}`} style={{ background: 'var(--ink)' }} />
          </button>
        </div>

        {/* Mobile menu */}
        <nav
          id="mobile-landing-nav"
          className="overflow-hidden transition-all duration-300 ease-out md:hidden"
          style={{
            maxHeight: mobileOpen ? '400px' : '0',
            borderTop: mobileOpen ? `1px solid var(--sand)` : 'none',
            backgroundColor: 'var(--cream)',
          }}
          aria-label="Mobile navigation"
          aria-hidden={!mobileOpen}
        >
          <ul className="flex flex-col px-6 py-6 gap-1">
            {NAV_LINKS.map((link, i) => (
              <li key={link.href}>
                <a
                  ref={i === 0 ? firstLinkRef : undefined}
                  href={link.href}
                  onClick={closeMobile}
                  tabIndex={mobileOpen ? 0 : -1}
                  className="block py-3 text-sm font-medium tracking-[0.1em] uppercase transition-opacity hover:opacity-60"
                  style={{ color: 'var(--ink)', borderBottom: `1px solid var(--sand)` }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 px-6 pb-6">
            <Link
              href="/login"
              onClick={closeMobile}
              tabIndex={mobileOpen ? 0 : -1}
              className="py-3 text-center text-xs font-medium tracking-[0.1em] uppercase"
              style={{ color: 'var(--ink)' }}
            >
              Log in
            </Link>
            <a
              href="#contact"
              onClick={closeMobile}
              tabIndex={mobileOpen ? 0 : -1}
              className="flex min-h-[44px] items-center justify-center rounded-full text-xs font-medium tracking-[0.1em] uppercase"
              style={{ backgroundColor: 'var(--sage)', color: 'var(--ink)' }}
            >
              Get Started
            </a>
          </div>
        </nav>
      </header>
    </>
  )
}
