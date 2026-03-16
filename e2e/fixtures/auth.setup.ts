/**
 * Auth setup project — runs before any test project that depends on [setup].
 * Delegates all work to global-setup.ts.
 */
import { test as setup } from '@playwright/test'
import globalSetup from './global-setup'

setup('create auth sessions for all roles', async () => {
  // globalSetup receives the full FullConfig; for direct invocation we pass a
  // minimal shim so the same function is callable here.
  await globalSetup({} as import('@playwright/test').FullConfig)
})
