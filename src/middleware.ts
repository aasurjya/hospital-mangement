import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Simple in-memory rate limiter for login attempts.
 * For production, replace with Redis-based (e.g., @upstash/ratelimit).
 */
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

const MAX_LOGIN_ATTEMPTS = 10
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
}

function checkLoginRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - 1 }
  }

  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    return { allowed: false, remaining: 0 }
  }

  loginAttempts.set(ip, { ...entry, count: entry.count + 1 })
  return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - entry.count - 1 }
}

// Clean up expired entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of loginAttempts.entries()) {
    if (now > entry.resetAt) loginAttempts.delete(ip)
  }
}, 60_000) // every minute

export function middleware(request: NextRequest) {
  // Rate limit login POST requests
  if (request.nextUrl.pathname === '/login' && request.method === 'POST') {
    const ip = getClientIp(request)
    const { allowed, remaining } = checkLoginRateLimit(ip)

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many login attempts. Please try again in 15 minutes.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900',
          },
        }
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login'],
}
