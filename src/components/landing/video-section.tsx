'use client'

import { useEffect, useRef } from 'react'
import { ScrollReveal } from './scroll-reveal'

export function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Play video when section enters viewport, pause when it leaves
  useEffect(() => {
    const video = videoRef.current
    const section = sectionRef.current
    if (!video || !section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative bg-neutral-950 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-teal-400/60">
              See it in action
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              How HospitalOS transforms your hospital
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="scale-up" delay={100}>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_40px_rgba(0,0,0,0.5),0_24px_80px_rgba(0,0,0,0.4)]">
            <video
              ref={videoRef}
              className="aspect-video w-full"
              preload="metadata"
              playsInline
              muted
              loop
            >
              <source src="/videos/hospital-movie.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
