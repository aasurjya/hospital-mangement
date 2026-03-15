import Link from 'next/link'

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <span className="text-lg font-bold text-neutral-900">HospitalOS</span>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">
              Modern hospital management platform — streamline care, empower staff, stay compliant.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              HIPAA-Ready
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Product</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#features" className="inline-flex min-h-[44px] items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900">Features</a></li>
              <li><a href="#ai" className="inline-flex min-h-[44px] items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900">AI Co-pilot</a></li>
              <li><a href="#how-it-works" className="inline-flex min-h-[44px] items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900">How It Works</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Company</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="#contact" className="inline-flex min-h-[44px] items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900">Contact</a></li>
              <li><Link href="/login" className="inline-flex min-h-[44px] items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900">Log in</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Legal</h3>
            <ul className="mt-4 space-y-3">
              <li><a href="/privacy" className="inline-flex min-h-[44px] items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900">Privacy Policy</a></li>
              <li><a href="/terms" className="inline-flex min-h-[44px] items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-neutral-200 pt-8 text-center text-sm text-neutral-400">
          &copy; {currentYear} HospitalOS. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
