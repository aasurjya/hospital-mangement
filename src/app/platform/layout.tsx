/**
 * Platform admin layout — guards all /platform/* routes.
 */
import { requirePlatformAdmin } from '@/lib/rbac/guards'
import { PlatformNav } from '@/components/platform-nav'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requirePlatformAdmin()

  return (
    <div className="min-h-screen bg-neutral-50">
      <PlatformNav userFullName={ctx.profile.full_name} />
      <div className="h-16" aria-hidden="true" />
      <main id="main-content">{children}</main>
    </div>
  )
}
