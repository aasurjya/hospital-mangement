import { ScrollReveal } from './scroll-reveal'

const AI_CAPABILITIES = [
  {
    n: '01',
    title: 'Clinical Notes',
    description: 'AI helps clinicians draft structured notes from conversations, reducing documentation time by up to 60%.',
  },
  {
    n: '02',
    title: 'Smart Scheduling',
    description: 'Intelligent appointment suggestions factoring in doctor availability, patient history, and urgency levels.',
  },
  {
    n: '03',
    title: 'Diagnostic Support',
    description: 'AI-powered differential diagnosis suggestions based on symptoms, labs, and patient history — always reviewed by a human clinician.',
    comingSoon: true,
  },
  {
    n: '04',
    title: 'Workload Insights',
    description: 'Real-time analytics on department load, helping administrators distribute patients and staff optimally.',
    comingSoon: true,
  },
] as const satisfies ReadonlyArray<{ n: string; title: string; description: string; comingSoon?: boolean }>

export function AiSection() {
  return (
    <section
      id="ai"
      className="px-6 py-24 lg:px-12 lg:py-36"
      style={{ backgroundColor: 'var(--ink)', color: 'var(--cream)' }}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left: heading */}
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col justify-between gap-12 lg:h-full">
              <div>
                <p className="section-label mb-3" style={{ color: 'rgba(249,248,245,0.4)' }}>AI-Powered</p>
                <h2
                  className="font-sans font-medium uppercase leading-[0.95] tracking-tight"
                  style={{ fontSize: 'clamp(2.5rem, 4.5vw, 5rem)', color: 'var(--cream)' }}
                >
                  Your staff&rsquo;s<br />
                  <span className="font-display italic font-light" style={{ fontSize: '0.9em', color: 'var(--sage)' }}>
                    intelligent co-pilot
                  </span>
                </h2>
                <p
                  className="mt-8 max-w-[36ch] text-xs font-medium leading-relaxed tracking-[0.08em] uppercase"
                  style={{ color: 'rgba(249,248,245,0.5)' }}
                >
                  Our AI clinical assistant works alongside doctors and nurses — never replacing human judgement, but amplifying it. Every suggestion requires clinician approval.
                </p>
              </div>

              {/* Safety badge */}
              <div
                className="inline-flex items-center gap-3 self-start border-l-2 pl-4"
                style={{ borderColor: 'var(--sage)' }}
              >
                <p
                  className="text-xs font-medium leading-relaxed tracking-[0.08em] uppercase"
                  style={{ color: 'rgba(249,248,245,0.4)' }}
                >
                  Clinician-assistive only.<br />All AI outputs require human review and are fully audited.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Right: capability list */}
          <ScrollReveal animation="fade-up" delay={120}>
            <div>
              <div className="h-px mb-0" style={{ backgroundColor: 'rgba(249,248,245,0.1)' }} />
              {AI_CAPABILITIES.map((cap, i) => (
                <div
                  key={cap.n}
                  className="flex items-start gap-6 border-b py-8"
                  style={{ borderColor: 'rgba(249,248,245,0.1)' }}
                >
                  <span className="mt-0.5 shrink-0 text-xs font-medium tracking-[0.1em]" style={{ color: 'rgba(249,248,245,0.25)' }}>
                    {cap.n}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className="font-sans text-sm font-medium uppercase tracking-[0.06em]"
                        style={{ color: 'var(--cream)' }}
                      >
                        {cap.title}
                      </h3>
                      {'comingSoon' in cap && cap.comingSoon && (
                        <span
                          className="text-[10px] font-medium tracking-[0.1em] uppercase px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(149,196,200,0.15)', color: 'var(--sage)' }}
                        >
                          Soon
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs font-medium leading-relaxed tracking-[0.05em] uppercase"
                      style={{ color: 'rgba(249,248,245,0.4)' }}
                    >
                      {cap.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
