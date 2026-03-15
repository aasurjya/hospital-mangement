'use client'

import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 50000, suffix: '+', label: 'Patient Records Managed', prefix: '' },
  { value: 99.9, suffix: '%', label: 'Uptime Guarantee', prefix: '' },
  { value: 60, suffix: '%', label: 'Reduction in Documentation Time', prefix: '' },
  { value: 0, suffix: '24/7', label: 'Real-time Support', prefix: '', static: true },
] as const

function AnimatedCounter({ target, suffix, prefix }: { target: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 2000
          const steps = 60
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              current = target
              clearInterval(timer)
            }
            setCount(current)
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  const display = target >= 1000
    ? Math.floor(count).toLocaleString()
    : Number.isInteger(target)
      ? Math.floor(count).toString()
      : count.toFixed(1)

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  )
}

export function StatsSection() {
  return (
    <section className="relative bg-neutral-950 py-16 lg:py-20">

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                {'static' in stat && stat.static
                  ? <>{stat.suffix}</>
                  : <AnimatedCounter target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />}
              </p>
              <p className="mt-2 text-sm font-medium text-neutral-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
