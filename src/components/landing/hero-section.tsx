export function HeroSection() {
  return (
    <section
      className="relative flex min-h-screen flex-col justify-between overflow-hidden px-6 pt-[72px] pb-12 lg:px-12"
      style={{ backgroundColor: 'var(--cream)', color: 'var(--ink)' }}
    >
      {/* Brushstroke SVG accent — sage teal sweep, positioned behind line 2 */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          bottom: '32%',
          right: '-2%',
          width: '55vw',
          opacity: 0.5,
        }}
        viewBox="0 0 800 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 80 C80 20, 200 100, 350 55 S 580 10, 790 65"
          stroke="var(--sage)"
          strokeWidth="52"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
          style={{ filter: 'blur(8px)' }}
        />
        <path
          d="M10 80 C80 20, 200 100, 350 55 S 580 10, 790 65"
          stroke="var(--sage)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </svg>

      {/* Main display headline */}
      <div className="flex flex-1 items-end pb-8">
        <div className="w-full">
          {/* Line 1 */}
          <div className="clip-reveal-wrap w-full">
            <h1
              className="clip-reveal block font-sans font-medium uppercase leading-[0.92] tracking-tight"
              style={{
                fontSize: 'clamp(3.5rem, 11.5vw, 13rem)',
                animationDelay: '0.1s',
                color: 'var(--ink)',
              }}
            >
              Hospital
            </h1>
          </div>

          {/* Line 2 — slightly indented like felix-nieto.com */}
          <div className="clip-reveal-wrap w-full">
            <div
              className="clip-reveal block font-sans font-medium uppercase leading-[0.92] tracking-tight"
              style={{
                fontSize: 'clamp(3.5rem, 11.5vw, 13rem)',
                paddingLeft: 'clamp(1rem, 8vw, 9rem)',
                animationDelay: '0.18s',
                color: 'var(--ink)',
              }}
            >
              Management
            </div>
          </div>

          {/* Line 3 — accent word in display serif / italic */}
          <div className="clip-reveal-wrap w-full">
            <div
              className="clip-reveal block font-display italic font-light leading-[1] tracking-tight"
              style={{
                fontSize: 'clamp(3rem, 9vw, 10.5rem)',
                animationDelay: '0.26s',
                color: 'var(--ink)',
                opacity: 0.85,
              }}
            >
              Reimagined.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: description left, CTA right */}
      <div
        className="fade-up flex flex-col gap-6 border-t pt-6 sm:flex-row sm:items-end sm:justify-between"
        style={{ borderColor: 'var(--sand)', animationDelay: '0.55s' }}
      >
        <div className="max-w-xs">
          <p
            className="text-xs font-medium leading-relaxed tracking-[0.1em] uppercase"
            style={{ color: 'var(--sand)' }}
          >
            From intake to discharge — every clinical and administrative workflow in one secure, multi-tenant platform.
          </p>
        </div>

        <div className="flex items-center gap-8">
          {/* Trust badges */}
          <div className="hidden gap-6 sm:flex">
            {['HIPAA-Ready', 'Role-Based Access', 'Full Audit Trail'].map((badge) => (
              <span
                key={badge}
                className="text-[10px] font-medium tracking-[0.12em] uppercase"
                style={{ color: 'var(--sand)' }}
              >
                {badge}
              </span>
            ))}
          </div>
          {/* CTA — inline link style */}
          <a
            href="#contact"
            className="group flex items-center gap-2 text-xs font-medium tracking-[0.12em] uppercase transition-opacity hover:opacity-60"
            style={{ color: 'var(--ink)' }}
          >
            Request Demo
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-1"
            >
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="fade-up absolute bottom-8 left-6 hidden items-center gap-3 lg:flex"
        style={{ animationDelay: '0.7s' }}
      >
        <div
          className="h-px w-8"
          style={{ backgroundColor: 'var(--sand)' }}
        />
        <span
          className="text-[10px] font-medium tracking-[0.2em] uppercase"
          style={{ color: 'var(--sand)' }}
        >
          Scroll
        </span>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true">
          <path d="M5 1v12M2 9l3 4 3-4" stroke="var(--sand)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </section>
  )
}
