'use client'

import { useRef, type ReactNode, type MouseEvent } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export function TiltCard({ children, className = '' }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const card = cardRef.current
    if (!card) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    card.style.transform = `perspective(600px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateZ(4px)`
  }

  function handleMouseLeave() {
    const card = cardRef.current
    if (!card) return
    card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    setTimeout(() => {
      if (cardRef.current) cardRef.current.style.transition = ''
    }, 400)
  }

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: 'transform', transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  )
}
