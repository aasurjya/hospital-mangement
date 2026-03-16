import Link from 'next/link'

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="px-6 py-16 lg:px-12 lg:py-24"
      style={{ backgroundColor: 'var(--ink)', color: 'var(--cream)' }}
    >
      <div className="mx-auto max-w-[1400px]">
        {/* Top row */}
        <div className="flex flex-col gap-12 border-b pb-12 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: 'rgba(249,248,245,0.12)' }}>
          {/* Brand */}
          <div>
            <span className="text-sm font-medium tracking-[0.12em] uppercase">
              HospitalOS<span style={{ color: 'var(--sage)' }}>.</span>
            </span>
            <p
              className="mt-4 max-w-[28ch] text-xs font-medium leading-relaxed tracking-[0.08em] uppercase"
              style={{ color: 'rgba(249,248,245,0.4)' }}
            >
              Modern hospital management — streamline care, empower staff, stay compliant.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <p className="mb-4 text-[10px] font-medium tracking-[0.15em] uppercase" style={{ color: 'rgba(249,248,245,0.35)' }}>
                Product
              </p>
              <ul className="flex flex-col gap-3">
                {['#features', '#how-it-works', '#contact'].map((href, i) => (
                  <li key={href}>
                    <a
                      href={href}
                      className="text-xs font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-60"
                      style={{ color: 'var(--cream)' }}
                    >
                      {['Features', 'How It Works', 'Contact'][i]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-[10px] font-medium tracking-[0.15em] uppercase" style={{ color: 'rgba(249,248,245,0.35)' }}>
                Account
              </p>
              <ul className="flex flex-col gap-3">
                <li>
                  <Link href="/login" className="text-xs font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-60" style={{ color: 'var(--cream)' }}>
                    Log in
                  </Link>
                </li>
                <li>
                  <a href="/privacy" className="text-xs font-medium tracking-[0.08em] uppercase transition-opacity hover:opacity-60" style={{ color: 'var(--cream)' }}>
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[10px] font-medium tracking-[0.12em] uppercase" style={{ color: 'rgba(249,248,245,0.3)' }}>
            © {year} HospitalOS. All rights reserved.
          </span>
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-medium tracking-[0.1em] uppercase" style={{ backgroundColor: 'rgba(149,196,200,0.15)', color: 'var(--sage)' }}>
            HIPAA-Ready · SOC 2
          </span>
        </div>
      </div>
    </footer>
  )
}
