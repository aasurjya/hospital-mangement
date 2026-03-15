'use client'

import { AnimatedWords } from './animated-words'

const STATIC_WORDS = ['Modern', 'Hospital', 'Management,']

export function HeroHeadline() {
  return (
    <h1 className="hero-animate mx-auto max-w-4xl font-display text-5xl leading-[1.15] tracking-tight text-slate-100 sm:text-6xl lg:text-7xl">
      {STATIC_WORDS.map((word, i) => (
        <span key={word} className="word-reveal-wrap">
          <span
            className="word-reveal"
            style={{ animationDelay: `${0.4 + i * 0.09}s` }}
          >
            {word}
          </span>
          {i < STATIC_WORDS.length - 1 ? '\u00A0' : ' '}
        </span>
      ))}
      <AnimatedWords />
      <span className="sr-only">Powered by AI</span>
    </h1>
  )
}
