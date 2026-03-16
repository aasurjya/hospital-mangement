import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { LandingHeader } from '@/components/landing/landing-header'
import { HeroSection } from '@/components/landing/hero-section'
import { VideoSection } from '@/components/landing/video-section'
import { SecuritySection } from '@/components/landing/security-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { DashboardPreview } from '@/components/landing/dashboard-preview'
import { AiSection } from '@/components/landing/ai-section'
import { HowItWorksSection } from '@/components/landing/how-it-works'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { FaqSection } from '@/components/landing/faq-section'
import { ContactSection } from '@/components/landing/contact-section'
import { LandingFooter } from '@/components/landing/landing-footer'

export const metadata: Metadata = {
  title: 'HospitalOS — Modern Hospital Management, Powered by AI',
  description:
    'Streamline patient care, staff workflows, and clinical operations in one secure, multi-tenant platform built for modern hospitals.',
}

export default async function RootPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--cream)' }}>
      <LandingHeader />
      <main id="main-content">
        <HeroSection />
        <VideoSection />
        <SecuritySection />
        <FeaturesSection />
        <DashboardPreview />
        <AiSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FaqSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  )
}
