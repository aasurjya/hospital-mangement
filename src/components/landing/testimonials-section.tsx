import { ScrollReveal } from './scroll-reveal'

const TESTIMONIALS = [
  {
    quote:
      'HospitalOS cut our patient intake time in half. The AI-assisted notes mean our doctors spend more time with patients and less time typing.',
    author: 'Dr. Priya Sharma',
    role: 'Chief Medical Officer',
    hospital: 'Metro General Hospital',
    initials: 'PS',
  },
  {
    quote:
      'We went from spreadsheets to a fully digital operation in under a week. The onboarding team handled everything — our staff just logged in and started working.',
    author: 'James Okonkwo',
    role: 'Hospital Administrator',
    hospital: 'Sunrise Community Health',
    initials: 'JO',
  },
  {
    quote:
      'The role-based access control and audit trail gave our compliance team confidence from day one. We signed the BAA in 24 hours.',
    author: 'Sarah Chen',
    role: 'Director of IT & Compliance',
    hospital: 'Pacific Coast Medical Center',
    initials: 'SC',
  },
] as const

export function TestimonialsSection() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-400">
              Trusted by hospitals
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              What our clients say
            </h2>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {TESTIMONIALS.map((t, index) => (
            <ScrollReveal key={t.author} animation="fade-up" delay={index * 100}>
              <div className="group flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-6 transition-shadow duration-300 hover:shadow-md">
                {/* Quote mark */}
                <span className="quote-mark" aria-hidden="true">&ldquo;</span>

                {/* Quote */}
                <blockquote className="flex-1 text-sm leading-relaxed text-neutral-700">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{t.author}</p>
                    <p className="text-xs text-neutral-500">
                      {t.role}, {t.hospital}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
