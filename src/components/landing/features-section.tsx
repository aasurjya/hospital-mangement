import { ScrollReveal } from './scroll-reveal'

const FEATURES = [
  {
    n: '01',
    title: 'Patient Management',
    description: 'Complete records with auto-generated MRNs, demographics, and powerful full-text search.',
  },
  {
    n: '02',
    title: 'Staff & Roles',
    description: 'Fine-grained access for doctors, nurses, receptionists, and 8 additional clinical roles.',
  },
  {
    n: '03',
    title: 'Appointments',
    description: 'Book, confirm, and track the full appointment lifecycle with real-time status updates.',
  },
  {
    n: '04',
    title: 'Admissions',
    description: 'Room assignment, transfers, and discharge — full admission lifecycle in one flow.',
  },
  {
    n: '05',
    title: 'Medical Records',
    description: 'Structured DRAFT → FINALIZED workflow that protects clinical data integrity.',
  },
  {
    n: '06',
    title: 'Real-time Chat',
    description: 'Secure direct, group, and broadcast messaging for your entire clinical team.',
  },
  {
    n: '07',
    title: 'Departments',
    description: 'Organize by departments with head-doctor assignments and staff scoping.',
  },
  {
    n: '08',
    title: 'Audit & Compliance',
    description: 'Every action logged — actor, timestamp, and context. Full trails, always.',
  },
] as const

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="px-6 py-24 lg:px-12 lg:py-36"
      style={{ backgroundColor: 'var(--cream)', borderTop: '1px solid var(--sand)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1400px]">
        {/* Section header */}
        <ScrollReveal animation="fade-up">
          <div className="mb-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-label mb-3">8 modules, one platform</p>
              <h2
                className="font-sans font-medium uppercase leading-[0.95] tracking-tight"
                style={{ fontSize: 'clamp(2.5rem, 6vw, 6rem)', color: 'var(--ink)' }}
              >
                Everything<br />
                <span className="font-display italic font-light" style={{ fontSize: '0.88em' }}>
                  your hospital needs
                </span>
              </h2>
            </div>
            <p
              className="max-w-[28ch] text-xs font-medium leading-relaxed tracking-[0.08em] uppercase sm:text-right"
              style={{ color: 'var(--sand)' }}
            >
              From patient intake to discharge, every clinical and administrative workflow in a single, secure system.
            </p>
          </div>
        </ScrollReveal>

        {/* Divider */}
        <div className="line-draw mb-0 h-px" style={{ backgroundColor: 'var(--sand)' }} />

        {/* Feature rows */}
        <div>
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.n} animation="fade-up" delay={i * 40}>
              <div
                className="group flex items-start gap-6 border-b py-8 transition-all duration-300 sm:gap-12 sm:py-10"
                style={{ borderColor: 'var(--sand)' }}
              >
                {/* Number */}
                <span
                  className="mt-1 w-8 shrink-0 text-xs font-medium tracking-[0.1em]"
                  style={{ color: 'var(--sand)' }}
                >
                  {f.n}
                </span>

                {/* Title */}
                <h3
                  className="w-40 shrink-0 font-sans text-base font-medium uppercase tracking-[0.06em] sm:text-lg"
                  style={{ color: 'var(--ink)' }}
                >
                  {f.title}
                </h3>

                {/* Description */}
                <p
                  className="text-xs font-medium leading-relaxed tracking-[0.05em] uppercase"
                  style={{ color: 'var(--sand)' }}
                >
                  {f.description}
                </p>

                {/* Hover arrow */}
                <div className="ml-auto shrink-0 translate-x-0 opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M4 10h12M11 5l5 5-5 5" stroke="var(--sage)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
