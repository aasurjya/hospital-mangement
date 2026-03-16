const STEPS = [
  {
    step: '01',
    title: 'Get in Touch',
    description:
      'Reach out through our contact form or email. Tell us about your hospital, number of staff, and current workflows.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'We Set You Up',
    description:
      'Our team creates your hospital account, configures departments, roles, and rooms. We handle the technical setup so you don\'t have to.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Go Live',
    description:
      'Your team logs in, starts managing patients, scheduling appointments, and using AI assistance — from day one.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
      </svg>
    ),
  },
] as const

import { ScrollReveal } from './scroll-reveal'

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="px-6 py-24 lg:px-12 lg:py-36"
      style={{ backgroundColor: 'var(--cream-2)', borderTop: '1px solid var(--sand)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1400px]">
        <ScrollReveal animation="fade-up">
          <div className="mb-16">
            <p className="section-label mb-3">Live in 48 hours</p>
            <h2
              className="font-sans font-medium uppercase leading-[0.95] tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 5.5rem)', color: 'var(--ink)' }}
            >
              Getting started<br />
              <span className="font-display italic font-light" style={{ fontSize: '0.9em' }}>is simple</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid gap-0 lg:grid-cols-3">
          {STEPS.map((item, i) => (
            <ScrollReveal key={item.step} animation="fade-up" delay={i * 100}>
              <div
                className="flex flex-col gap-6 border-b py-10 lg:border-b-0 lg:border-r lg:px-8 lg:py-0 first:lg:pl-0 last:lg:border-r-0"
                style={{ borderColor: 'var(--sand)' }}
              >
                <span className="text-xs font-medium tracking-[0.1em]" style={{ color: 'var(--sand)' }}>
                  {item.step}
                </span>
                <h3
                  className="font-sans text-lg font-medium uppercase tracking-[0.06em]"
                  style={{ color: 'var(--ink)' }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-xs font-medium leading-relaxed tracking-[0.06em] uppercase"
                  style={{ color: 'var(--sand)' }}
                >
                  {item.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
