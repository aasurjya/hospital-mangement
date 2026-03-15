const AI_CAPABILITIES = [
  {
    title: 'Clinical Notes Assistance',
    description:
      'AI helps clinicians draft structured notes from conversations, reducing documentation time by up to 60%.',
  },
  {
    title: 'Smart Scheduling',
    description:
      'Intelligent appointment suggestions that factor in doctor availability, patient history, and urgency levels.',
  },
  {
    title: 'Diagnostic Support',
    description:
      'AI-powered differential diagnosis suggestions based on symptoms, labs, and patient history — always reviewed by a human clinician.',
    comingSoon: true,
  },
  {
    title: 'Staff Workload Insights',
    description:
      'Real-time analytics on department load, helping administrators distribute patients and staff optimally.',
    comingSoon: true,
  },
] as const satisfies ReadonlyArray<{ title: string; description: string; comingSoon?: boolean }>

import { ScrollReveal } from './scroll-reveal'

export function AiSection() {
  return (
    <section id="ai" className="bg-gradient-to-b from-neutral-50 to-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text side */}
          <ScrollReveal animation="slide-right">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              AI-Powered
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Your staff&rsquo;s{' '}
              <span className="text-gradient">intelligent co-pilot</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-600">
              Our AI clinical assistant works alongside doctors and nurses — never replacing
              human judgement, but amplifying it. Every suggestion requires clinician approval.
            </p>

            <ul className="mt-8 space-y-4" role="list">
              {AI_CAPABILITIES.map((cap) => (
                <li key={cap.title} className="flex gap-4">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                    <svg className="h-3.5 w-3.5 text-neutral-700" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {cap.title}
                      {'comingSoon' in cap && cap.comingSoon && (
                        <span className="ml-2 inline-flex rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-700">
                          Coming Soon
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                      {cap.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          </ScrollReveal>

          {/* Visual side — decorative dashboard mockup */}
          <ScrollReveal animation="slide-left" delay={150}>
          <div className="relative" aria-hidden="true">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl shadow-neutral-200/80">
              {/* Mock header bar */}
              <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-error-300" />
                  <div className="h-3 w-3 rounded-full bg-warning-300" />
                  <div className="h-3 w-3 rounded-full bg-success-300" />
                </div>
                <div className="h-4 w-48 rounded bg-neutral-100" />
              </div>

              {/* Mock AI suggestion card */}
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-secondary-50 p-4">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-secondary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                    </svg>
                    <span className="text-sm font-semibold text-secondary-700">AI Suggestion</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-700">
                    Based on elevated WBC count and reported symptoms, consider
                    ordering a CBC with differential and blood culture.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <div className="rounded-md bg-success-600 px-3 py-1 text-xs font-medium text-white">
                      Accept
                    </div>
                    <div className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600">
                      Dismiss
                    </div>
                  </div>
                </div>

                {/* Mock records */}
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                      <div className="h-8 w-8 rounded-full bg-primary-100" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 rounded bg-neutral-200" />
                        <div className="h-2.5 w-1/2 rounded bg-neutral-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
