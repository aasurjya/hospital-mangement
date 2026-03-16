'use client'

import { useState } from 'react'
import { ScrollReveal } from './scroll-reveal'

const FAQS = [
  {
    question: 'How long does onboarding take?',
    answer:
      'Most hospitals go live within 48 hours. Our team handles the full setup — creating your hospital account, configuring departments, roles, and rooms. Your staff just logs in.',
  },
  {
    question: 'Do you sign a Business Associate Agreement?',
    answer:
      'Yes. We sign BAAs with every hospital before any patient data enters the system. Our legal team can turn this around within 24 hours of your request.',
  },
  {
    question: 'Can we import existing patient data?',
    answer:
      'Yes. We support CSV imports for patient demographics, and our team will assist with data migration from your existing systems during onboarding at no extra cost.',
  },
  {
    question: 'What happens during downtime?',
    answer:
      'HospitalOS maintains 99.9% uptime with automated failovers. In the unlikely event of downtime, our team is alerted immediately and critical operations resume within minutes.',
  },
  {
    question: 'Which roles can access which data?',
    answer:
      'Access is controlled by 12 built-in roles — from Platform Admin to Receptionist. Each role has specific permissions enforced at the database level through Row-Level Security. A receptionist cannot see clinical notes; a nurse cannot modify staff records.',
  },
  {
    question: 'How much does HospitalOS cost?',
    answer:
      'Pricing is customized based on hospital size, number of staff, and modules needed. Contact us for a personalized quote — most hospitals find HospitalOS significantly more affordable than legacy EHR systems.',
  },
] as const

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b" style={{ borderColor: 'var(--sand)' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-8 py-7 text-left"
        aria-expanded={open}
      >
        <span
          className="text-sm font-medium uppercase tracking-[0.06em]"
          style={{ color: 'var(--ink)' }}
        >
          {question}
        </span>
        <svg
          className="h-4 w-4 shrink-0 transition-transform duration-300"
          style={{
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            color: open ? 'var(--sage)' : 'var(--sand)',
          }}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? '200px' : '0', opacity: open ? 1 : 0 }}
      >
        <p
          className="pb-7 text-xs font-medium leading-relaxed tracking-[0.06em] uppercase"
          style={{ color: 'var(--sand)' }}
        >
          {answer}
        </p>
      </div>
    </div>
  )
}

export function FaqSection() {
  return (
    <section
      className="px-6 py-24 lg:px-12 lg:py-36"
      style={{ backgroundColor: 'var(--cream-2)', borderTop: '1px solid var(--sand)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-16 lg:grid-cols-[1fr_2fr] lg:gap-24">
          {/* Left: heading */}
          <ScrollReveal animation="fade-up">
            <div>
              <p className="section-label mb-3">Common questions</p>
              <h2
                className="font-sans font-medium uppercase leading-[0.95] tracking-tight"
                style={{ fontSize: 'clamp(2rem, 3.5vw, 4rem)', color: 'var(--ink)' }}
              >
                Frequently<br />
                <span className="font-display italic font-light">asked.</span>
              </h2>
              <p
                className="mt-8 text-xs font-medium leading-relaxed tracking-[0.08em] uppercase"
                style={{ color: 'var(--sand)' }}
              >
                Can&rsquo;t find the answer?{' '}
                <a
                  href="#contact"
                  className="transition-opacity hover:opacity-60"
                  style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                >
                  Contact us directly.
                </a>
              </p>
            </div>
          </ScrollReveal>

          {/* Right: accordion */}
          <ScrollReveal animation="fade-up" delay={100}>
            <div>
              <div className="h-px" style={{ backgroundColor: 'var(--sand)' }} />
              {FAQS.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
