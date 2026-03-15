import { HeroHeadline } from './hero-headline'

export function HeroSection() {
  return (
    <section className="relative hero-mesh hero-grain hero-aurora overflow-hidden pt-36 pb-28 lg:pt-48 lg:pb-36">
      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center lg:px-8">
        {/* Version tag */}
        <p className="hero-animate mb-4 font-mono text-xs uppercase tracking-widest text-slate-500">
          v2.0 — Multi-tenant hospital OS
        </p>

        {/* Badge */}
        <div className="hero-animate mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm font-medium text-slate-300">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
          HIPAA-Ready &middot; SOC 2 Compliant
        </div>

        {/* Headline — word-by-word reveal */}
        <HeroHeadline />

        {/* Subtitle */}
        <p className="hero-animate mx-auto mt-8 max-w-xl text-xl leading-relaxed text-slate-400">
          Streamline patient care, staff workflows, and clinical operations — all in one
          platform.
        </p>

        {/* CTAs */}
        <div className="hero-animate mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#contact"
            className="btn-cta inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white active:scale-[0.97]"
          >
            Request a Demo
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm px-8 py-4 text-base font-semibold text-slate-300 transition-all hover:bg-white/10 hover:border-white/25 active:scale-[0.97]"
          >
            Explore Features
          </a>
        </div>

        {/* Trust signals */}
        <div className="hero-animate mt-20 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {[
            { label: 'HIPAA-Ready', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z' },
            { label: 'Role-Based Access', icon: 'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z' },
            { label: 'Full Audit Trail', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z' },
            { label: 'Multi-Tenant', icon: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="h-4 w-4 text-teal-500/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
