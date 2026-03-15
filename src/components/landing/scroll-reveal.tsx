'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type Animation = 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale-up'

interface Props {
  children: ReactNode
  animation?: Animation
  delay?: number
  className?: string
}

export function ScrollReveal({ children, animation = 'fade-up', delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.add('scroll-revealed')
          }, delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`scroll-reveal scroll-reveal--${animation} ${className}`}>
      {children}
    </div>
  )
}
