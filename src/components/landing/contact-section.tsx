'use client'

import { useState, type FormEvent } from 'react'
import { ScrollReveal } from './scroll-reveal'

interface FormState {
  status: 'idle' | 'submitted'
}

export function ContactSection() {
  const [state, setState] = useState<FormState>({ status: 'idle' })

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    const name = data.get('name') as string
    const email = data.get('email') as string
    const hospital = data.get('hospital') as string
    const message = data.get('message') as string

    const subject = encodeURIComponent(`HospitalOS Inquiry — ${hospital}`)
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nHospital: ${hospital}\n\n${message}`
    )

    window.open(`mailto:contact@hospitalos.com?subject=${subject}&body=${body}`, '_self')
    setState({ status: 'submitted' })
  }

  const inputStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--sand)',
    borderRadius: 0,
    color: 'var(--ink)',
    outline: 'none',
    width: '100%',
    padding: '12px 0',
    fontSize: '0.75rem',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.625rem',
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--sand)',
    marginBottom: '4px',
  }

  return (
    <section
      id="contact"
      className="px-6 py-24 lg:px-12 lg:py-36"
      style={{ backgroundColor: 'var(--ink)', color: 'var(--cream)' }}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
          {/* Left: heading */}
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col justify-between gap-12">
              <div>
                <p className="section-label mb-3" style={{ color: 'rgba(249,248,245,0.4)' }}>Get started</p>
                <h2
                  className="font-sans font-medium uppercase leading-[0.95] tracking-tight"
                  style={{ fontSize: 'clamp(2.5rem, 4.5vw, 5rem)', color: 'var(--cream)' }}
                >
                  Request<br />
                  <span className="font-display italic font-light" style={{ fontSize: '0.9em', color: 'var(--sage)' }}>your demo.</span>
                </h2>
                <p
                  className="mt-8 max-w-[30ch] text-xs font-medium leading-relaxed tracking-[0.08em] uppercase"
                  style={{ color: 'rgba(249,248,245,0.4)' }}
                >
                  We&rsquo;ll set up your hospital account within 48 hours. No commitments, no contracts upfront.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {['Live in 48 hours', 'BAA signed same day', 'Full team onboarding'].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="h-px w-4" style={{ backgroundColor: 'var(--sage)' }} />
                    <span
                      className="text-xs font-medium uppercase tracking-[0.1em]"
                      style={{ color: 'rgba(249,248,245,0.5)' }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Right: form */}
          <ScrollReveal animation="fade-up" delay={120}>
            {state.status === 'submitted' ? (
              <div
                className="flex flex-col items-start justify-center gap-6 border-l pl-8"
                style={{ borderColor: 'rgba(249,248,245,0.1)' }}
                role="status"
                aria-live="polite"
              >
                <div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(149,196,200,0.15)' }}
                >
                  <svg className="h-5 w-5" style={{ color: 'var(--sage)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <h3
                    className="font-sans text-base font-medium uppercase tracking-[0.06em]"
                    style={{ color: 'var(--cream)' }}
                  >
                    Email client opened
                  </h3>
                  <p
                    className="mt-2 text-xs font-medium leading-relaxed tracking-[0.06em] uppercase"
                    style={{ color: 'rgba(249,248,245,0.4)' }}
                  >
                    Please send the pre-filled email. We&rsquo;ll respond within 48 hours.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setState({ status: 'idle' })}
                  className="text-xs font-medium uppercase tracking-[0.1em] transition-opacity hover:opacity-60"
                  style={{ color: 'var(--sage)' }}
                >
                  Fill out again →
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-8 border-l pl-8"
                style={{ borderColor: 'rgba(249,248,245,0.1)' }}
              >
                <div>
                  <label htmlFor="contact-name" style={{ ...labelStyle, color: 'rgba(249,248,245,0.35)' }}>
                    Your name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Dr. Sarah Johnson"
                    style={{ ...inputStyle, borderBottomColor: 'rgba(249,248,245,0.15)' }}
                    onFocus={(e) => { e.target.style.borderBottomColor = 'var(--sage)' }}
                    onBlur={(e) => { e.target.style.borderBottomColor = 'rgba(249,248,245,0.15)' }}
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" style={{ ...labelStyle, color: 'rgba(249,248,245,0.35)' }}>
                    Email address <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="sarah@hospital.org"
                    style={{ ...inputStyle, borderBottomColor: 'rgba(249,248,245,0.15)' }}
                    onFocus={(e) => { e.target.style.borderBottomColor = 'var(--sage)' }}
                    onBlur={(e) => { e.target.style.borderBottomColor = 'rgba(249,248,245,0.15)' }}
                  />
                </div>

                <div>
                  <label htmlFor="contact-hospital" style={{ ...labelStyle, color: 'rgba(249,248,245,0.35)' }}>
                    Hospital name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-hospital"
                    name="hospital"
                    type="text"
                    required
                    placeholder="City General Hospital"
                    style={{ ...inputStyle, borderBottomColor: 'rgba(249,248,245,0.15)' }}
                    onFocus={(e) => { e.target.style.borderBottomColor = 'var(--sage)' }}
                    onBlur={(e) => { e.target.style.borderBottomColor = 'rgba(249,248,245,0.15)' }}
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" style={{ ...labelStyle, color: 'rgba(249,248,245,0.35)' }}>
                    Tell us about your needs <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={3}
                    required
                    placeholder="Number of staff, departments, current pain points..."
                    style={{
                      ...inputStyle,
                      borderBottomColor: 'rgba(249,248,245,0.15)',
                      resize: 'none',
                    }}
                    onFocus={(e) => { e.target.style.borderBottomColor = 'var(--sage)' }}
                    onBlur={(e) => { e.target.style.borderBottomColor = 'rgba(249,248,245,0.15)' }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    type="submit"
                    className="group flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] transition-opacity hover:opacity-60"
                    style={{ color: 'var(--cream)' }}
                  >
                    Request My Demo
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    >
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <p
                    className="text-[10px] font-medium uppercase tracking-[0.08em] text-right"
                    style={{ color: 'rgba(249,248,245,0.25)' }}
                  >
                    Or email{' '}
                    <a
                      href="mailto:contact@hospitalos.com"
                      className="transition-opacity hover:opacity-60"
                      style={{ color: 'rgba(249,248,245,0.4)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    >
                      contact@hospitalos.com
                    </a>
                  </p>
                </div>
              </form>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
