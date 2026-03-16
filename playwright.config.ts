import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E configuration for Hospital Management Platform.
 *
 * Key decisions:
 * - Single Chromium project (Desktop Chrome) for speed in CI.
 * - globalSetup creates a shared authenticated session per role to avoid
 *   repeated login flows inside every test.
 * - Serial test mode for data-dependent suites (clinical, billing, etc.).
 * - Traces and screenshots captured on failure for easy debugging.
 */
export default defineConfig({
  globalSetup: './e2e/fixtures/global-setup.ts',
  testDir: './e2e/tests',
  outputDir: './e2e/test-results',
  fullyParallel: false, // Most suites share DB state; run serially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Single worker — local Supabase + Next.js are single-tenant
  reporter: [
    ['html', { outputFolder: 'e2e/playwright-report', open: 'never' }],
    ['junit', { outputFile: 'e2e/test-results/junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // --- Setup project: seeds auth state files used by the test suites ---
    {
      name: 'setup',
      testDir: './e2e/fixtures',
      testMatch: /.*\.setup\.ts/,
    },

    // --- Test suites that depend on authenticated sessions ---
    {
      name: 'auth-tests',
      testMatch: /auth\.spec\.ts/,
      // Auth tests intentionally do NOT use stored state — they test the flow
    },
    {
      name: 'platform-admin-tests',
      testMatch: /platform-admin\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/fixtures/.auth/platform-admin.json',
      },
    },
    {
      name: 'staff-management-tests',
      testMatch: /staff-management\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/fixtures/.auth/hospital-admin.json',
      },
    },
    {
      name: 'clinical-tests',
      testMatch: /clinical\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/fixtures/.auth/hospital-admin.json',
      },
    },
    {
      name: 'billing-tests',
      testMatch: /billing\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/fixtures/.auth/hospital-admin.json',
      },
    },
    {
      name: 'rooms-tests',
      testMatch: /rooms\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/fixtures/.auth/hospital-admin.json',
      },
    },
    {
      name: 'reports-tests',
      testMatch: /reports\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/fixtures/.auth/hospital-admin.json',
      },
    },
    {
      name: 'ai-assistant-tests',
      testMatch: /ai-assistant\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/fixtures/.auth/doctor.json',
      },
    },
    {
      name: 'rbac-tests',
      testMatch: /rbac\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Start Next.js dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
