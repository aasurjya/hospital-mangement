/**
 * Login page — email and password authentication.
 * Redirects to role-appropriate dashboard on success.
 */
import { Suspense } from 'react'
import { LoginForm } from './login-form'

export const metadata = { title: 'Sign In | Hospital Platform' }

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Hospital Platform
          </h1>
          <p className="mt-1 text-sm text-neutral-600">Sign in to your account</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
