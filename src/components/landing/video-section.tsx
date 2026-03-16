'use client'

import { useEffect, useRef } from 'react'
import { ScrollReveal } from './scroll-reveal'

export function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

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
    <section
      ref={sectionRef}
      className="px-6 py-24 lg:px-12 lg:py-36"
      style={{ backgroundColor: 'var(--ink)', color: 'var(--cream)' }}
    >
      <div className="mx-auto max-w-[1400px]">
        <ScrollReveal animation="fade-up">
          <div className="mb-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-label mb-3" style={{ color: 'rgba(249,248,245,0.4)' }}>See it in action</p>
              <h2
                className="font-sans font-medium uppercase leading-[0.95] tracking-tight"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 5.5rem)', color: 'var(--cream)' }}
              >
                Watch it<br />
                <span className="font-display italic font-light" style={{ fontSize: '0.9em', color: 'var(--sage)' }}>work.</span>
              </h2>
            </div>
            <p
              className="max-w-[28ch] text-xs font-medium leading-relaxed tracking-[0.08em] uppercase sm:text-right"
              style={{ color: 'rgba(249,248,245,0.4)' }}
            >
              See how HospitalOS transforms patient intake, scheduling, and clinical workflows in a single platform.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={100}>
          <div
            className="relative mx-auto overflow-hidden"
            style={{ borderRadius: '4px', border: '1px solid rgba(249,248,245,0.08)' }}
            aria-label="HospitalOS product demo video"
          >
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
