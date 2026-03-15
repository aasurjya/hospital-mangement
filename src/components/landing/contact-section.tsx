'use client'

import { useState, type FormEvent } from 'react'

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

  return (
    <section id="contact" className="bg-gradient-to-b from-neutral-50 to-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
            Get Started
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Request your demo
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-neutral-600">
            We&rsquo;ll set up your hospital account within 48 hours.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          {state.status === 'submitted' ? (
            <div className="success-enter rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-lg shadow-neutral-100/80" role="status" aria-live="polite">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <svg className="h-6 w-6 text-neutral-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Email client opened</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Please send the pre-filled email to complete your request.
                We&rsquo;ll respond within 48 hours.
              </p>
              <button
                type="button"
                onClick={() => setState({ status: 'idle' })}
                className="mt-4 text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Fill out the form again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-neutral-700">
                  Your name <span className="text-error-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm shadow-sm transition-colors focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                  placeholder="Dr. Sarah Johnson"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-neutral-700">
                  Email address <span className="text-error-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm shadow-sm transition-colors focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                  placeholder="sarah@hospital.org"
                />
              </div>

              <div>
                <label htmlFor="contact-hospital" className="block text-sm font-medium text-neutral-700">
                  Hospital name <span className="text-error-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="contact-hospital"
                  name="hospital"
                  type="text"
                  required
                  className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm shadow-sm transition-colors focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                  placeholder="City General Hospital"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-neutral-700">
                  Tell us about your needs <span className="text-error-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  required
                  className="mt-2 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm shadow-sm transition-colors focus-visible:border-primary-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
                  placeholder="Number of staff, departments, current pain points..."
                />
              </div>

              <button
                type="submit"
                className="btn-cta w-full rounded-xl px-6 py-4 text-base font-semibold text-white active:scale-[0.97]"
              >
                Request My Demo
              </button>

              <p className="text-center text-xs text-neutral-500">
                Or email us directly at{' '}
                <a href="mailto:contact@hospitalos.com" className="font-medium text-primary-600 hover:text-primary-700">
                  contact@hospitalos.com
                </a>
              </p>
              <p className="text-center text-xs text-neutral-400">
                Your information is only used to respond to your inquiry. We never share data with third parties.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
