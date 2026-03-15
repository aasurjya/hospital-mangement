'use client'

import { useEffect, useState } from 'react'

const WORDS = [
  'Powered by AI',
  'Built for Clinicians',
  'Secure by Design',
  'Ready to Scale',
] as const

export function AnimatedWords() {
  const [index, setIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % WORDS.length)
        setIsVisible(true)
      }, 350)
    }, 3200)

    return () => clearInterval(interval)
  }, [])

  return (
    <span
      className={`inline-block italic text-shimmer transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
      }`}
      aria-hidden="true"
    >
      {WORDS[index]}
    </span>
  )
}
