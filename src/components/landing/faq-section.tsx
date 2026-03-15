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
    question: 'Do you sign a Business Associate Agreement (BAA)?',
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
    <div className="border-b border-neutral-200">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-neutral-900">{question}</span>
        <svg
          className={`h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{ maxHeight: open ? '200px' : '0', opacity: open ? 1 : 0 }}
      >
        <p className="pb-5 text-sm leading-relaxed text-neutral-600">{answer}</p>
      </div>
    </div>
  )
}

export function FaqSection() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              Common questions
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={100}>
          <div className="mt-12 divide-y divide-neutral-200 border-t border-neutral-200">
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
