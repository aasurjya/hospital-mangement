import { ScrollReveal } from './scroll-reveal'

const SECURITY_ITEMS = [
  {
    n: '01',
    title: 'Data Encryption',
    description: 'AES-256 at rest. TLS 1.3 in transit. Every byte of patient data protected at every layer.',
  },
  {
    n: '02',
    title: 'HIPAA BAA',
    description: 'We sign Business Associate Agreements with every hospital — turned around within 24 hours.',
  },
  {
    n: '03',
    title: 'Complete Audit Trail',
    description: 'Every action logged — actor, timestamp, context. Exportable reports for any regulatory review.',
  },
  {
    n: '04',
    title: 'Role-Based Access',
    description: '12 built-in roles enforced at the database level via RLS. Staff see only what they need — nothing more.',
  },
] as const

export function SecuritySection() {
  return (
    <section
      className="px-6 py-24 lg:px-12 lg:py-36"
      style={{ backgroundColor: 'var(--cream-2)', borderTop: '1px solid var(--sand)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1400px]">
        <ScrollReveal animation="fade-up">
          <div className="mb-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-label mb-3">Enterprise-grade security</p>
              <h2
                className="font-sans font-medium uppercase leading-[0.95] tracking-tight"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 5.5rem)', color: 'var(--ink)' }}
              >
                Built for<br />
                <span className="font-display italic font-light" style={{ fontSize: '0.9em' }}>compliance.</span>
              </h2>
            </div>
            <p
              className="max-w-[28ch] text-xs font-medium leading-relaxed tracking-[0.08em] uppercase sm:text-right"
              style={{ color: 'var(--sand)' }}
            >
              Security is not an add-on — it is the foundation of every layer of HospitalOS.
            </p>
          </div>
        </ScrollReveal>

        <div className="h-px" style={{ backgroundColor: 'var(--sand)' }} />

        <div className="grid gap-0 sm:grid-cols-2">
          {SECURITY_ITEMS.map((item, i) => (
            <ScrollReveal key={item.n} animation="fade-up" delay={i * 60}>
              <div
                className={`flex flex-col gap-4 py-10 ${
                  i % 2 === 0 ? 'sm:pr-12' : 'sm:pl-12 sm:border-l'
                } border-b`}
                style={{ borderColor: 'var(--sand)' }}
              >
                <span className="text-xs font-medium tracking-[0.1em]" style={{ color: 'var(--sand)' }}>
                  {item.n}
                </span>
                <h3
                  className="font-sans text-base font-medium uppercase tracking-[0.06em]"
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
