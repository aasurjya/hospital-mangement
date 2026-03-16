import { ScrollReveal } from './scroll-reveal'

const TESTIMONIALS = [
  {
    quote:
      'HospitalOS cut our patient intake time in half. The AI-assisted notes mean our doctors spend more time with patients and less time typing.',
    author: 'Dr. Priya Sharma',
    role: 'Chief Medical Officer',
    hospital: 'Metro General Hospital',
  },
  {
    quote:
      'We went from spreadsheets to a fully digital operation in under a week. The onboarding team handled everything — our staff just logged in and started working.',
    author: 'James Okonkwo',
    role: 'Hospital Administrator',
    hospital: 'Sunrise Community Health',
  },
  {
    quote:
      'The role-based access control and audit trail gave our compliance team confidence from day one. We signed the BAA in 24 hours.',
    author: 'Sarah Chen',
    role: 'Director of IT & Compliance',
    hospital: 'Pacific Coast Medical Center',
  },
] as const

export function TestimonialsSection() {
  return (
    <section
      className="px-6 py-24 lg:px-12 lg:py-36"
      style={{ backgroundColor: 'var(--cream)', borderTop: '1px solid var(--sand)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1400px]">
        <ScrollReveal animation="fade-up">
          <div className="mb-16">
            <p className="section-label mb-3">Trusted by hospitals</p>
            <h2
              className="font-sans font-medium uppercase leading-[0.95] tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 5.5rem)', color: 'var(--ink)' }}
            >
              What our<br />
              <span className="font-display italic font-light" style={{ fontSize: '0.9em' }}>clients say</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="h-px" style={{ backgroundColor: 'var(--sand)' }} />

        <div className="grid gap-0 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal key={t.author} animation="fade-up" delay={i * 100}>
              <div
                className="flex flex-col gap-8 border-b py-12 lg:border-b-0 lg:border-r lg:px-8 lg:py-10 first:lg:pl-0 last:lg:border-r-0"
                style={{ borderColor: 'var(--sand)' }}
              >
                {/* Large decorative quote mark */}
                <span
                  className="font-display leading-none select-none"
                  style={{ fontSize: '5rem', lineHeight: 1, color: 'var(--sand)', fontStyle: 'italic' }}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                <blockquote
                  className="flex-1 font-display italic font-light leading-relaxed"
                  style={{ fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', color: 'var(--ink)' }}
                >
                  {t.quote}
                </blockquote>

                <div className="border-t pt-6" style={{ borderColor: 'var(--sand)' }}>
                  <p
                    className="text-xs font-medium uppercase tracking-[0.1em]"
                    style={{ color: 'var(--ink)' }}
                  >
                    {t.author}
                  </p>
                  <p
                    className="mt-1 text-xs font-medium uppercase tracking-[0.08em]"
                    style={{ color: 'var(--sand)' }}
                  >
                    {t.role} — {t.hospital}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
