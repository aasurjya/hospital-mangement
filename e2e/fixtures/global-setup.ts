/**
 * Global setup — runs once before all test suites.
 *
 * Creates:
 *   1. A test hospital via the platform admin UI
 *   2. A hospital admin account (sets password via Supabase Admin API)
 *   3. Saved auth session files for each role so tests skip the login page
 *
 * Designed to be idempotent: if the hospital already exists it is reused.
 */

import { chromium, type FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { PLATFORM_ADMIN, HOSPITAL_ADMIN, DOCTOR, NURSE, BILLING_STAFF, RECEPTIONIST, TEST_HOSPITAL } from './test-data'

const AUTH_DIR = path.join(__dirname, '.auth')

async function globalSetup(_config: FullConfig) {
  fs.mkdirSync(AUTH_DIR, { recursive: true })

  const browser = await chromium.launch()

  try {
    // ── Step 1: Save platform admin session ──────────────────────────────
    await saveAuthSession(browser, PLATFORM_ADMIN.email, PLATFORM_ADMIN.password, 'platform-admin')

    // ── Step 2: Create test hospital (idempotent) ──────────────────────
    const hospitalId = await ensureTestHospital(browser)
    console.log(`[setup] Hospital ID: ${hospitalId}`)

    // ── Step 3: Create staff accounts via Supabase Admin API ────────────
    await ensureStaffAccounts(hospitalId)

    // ── Step 4: Save hospital admin session ────────────────────────────
    await saveAuthSession(browser, HOSPITAL_ADMIN.email, HOSPITAL_ADMIN.password, 'hospital-admin')

    // ── Step 5: Save doctor session ────────────────────────────────────
    await saveAuthSession(browser, DOCTOR.email, DOCTOR.password, 'doctor')

    // ── Step 6: Save nurse session ─────────────────────────────────────
    await saveAuthSession(browser, NURSE.email, NURSE.password, 'nurse')

    // ── Step 7: Save billing staff session ─────────────────────────────
    await saveAuthSession(browser, BILLING_STAFF.email, BILLING_STAFF.password, 'billing-staff')

    // ── Step 8: Save receptionist session ──────────────────────────────
    await saveAuthSession(browser, RECEPTIONIST.email, RECEPTIONIST.password, 'receptionist')

    console.log('[setup] All auth sessions saved.')
  } finally {
    await browser.close()
  }
}

async function saveAuthSession(
  browser: import('@playwright/test').Browser,
  email: string,
  password: string,
  name: string
) {
  const outputFile = path.join(AUTH_DIR, `${name}.json`)

  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  await page.goto('http://localhost:3000/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')

  // Wait for redirect away from /login
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 })

  await ctx.storageState({ path: outputFile })
  await ctx.close()
  console.log(`[setup] Saved session: ${name}`)
}

async function ensureTestHospital(browser: import('@playwright/test').Browser): Promise<string> {
  const ctx = await browser.newContext({
    storageState: path.join(AUTH_DIR, 'platform-admin.json'),
  })
  const page = await ctx.newPage()

  try {
    await page.goto('http://localhost:3000/platform/hospitals')
    await page.waitForLoadState('networkidle')

    // Check if our test hospital already exists
    const existingLink = page.locator(`a:has-text("${TEST_HOSPITAL.name}")`)
    if (await existingLink.count() > 0) {
      // Extract the hospital ID from the href
      const href = await existingLink.getAttribute('href')
      const match = href?.match(/\/platform\/hospitals\/([^/]+)/)
      if (match) {
        await ctx.close()
        return match[1]
      }
    }

    // Create new hospital
    await page.click('a:has-text("Add hospital")')
    await page.waitForURL('**/hospitals/new')

    await page.fill('#name', TEST_HOSPITAL.name)

    // Slug may be auto-generated; check if field exists
    const slugField = page.locator('#slug')
    if (await slugField.count() > 0) {
      await slugField.fill(TEST_HOSPITAL.slug)
    }

    await page.click('button[type="submit"]')
    await page.waitForURL('**/platform/hospitals/**', { timeout: 10_000 })

    const url = page.url()
    const match = url.match(/\/platform\/hospitals\/([^/]+)/)
    if (!match) throw new Error(`Could not extract hospital ID from URL: ${url}`)
    return match[1]
  } finally {
    await ctx.close()
  }
}

async function ensureStaffAccounts(hospitalId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    console.warn('[setup] SUPABASE_SERVICE_ROLE_KEY not set — skipping staff account creation via API')
    return
  }

  const staffToCreate = [
    { ...HOSPITAL_ADMIN, role: 'HOSPITAL_ADMIN', full_name: 'E2E Hospital Admin' },
    { ...DOCTOR, role: 'DOCTOR', full_name: 'Dr. E2E Doctor' },
    { ...NURSE, role: 'NURSE', full_name: 'E2E Nurse' },
    { ...BILLING_STAFF, role: 'BILLING_STAFF', full_name: 'E2E Billing Staff' },
    { ...RECEPTIONIST, role: 'RECEPTIONIST', full_name: 'E2E Receptionist' },
  ]

  for (const staff of staffToCreate) {
    await upsertStaffAccount(supabaseUrl, serviceKey, hospitalId, staff)
  }
}

async function upsertStaffAccount(
  supabaseUrl: string,
  serviceKey: string,
  hospitalId: string,
  staff: {
    email: string
    password: string
    role: string
    full_name: string
  }
) {
  // Check if the user already exists
  const listRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=500`, {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
  })

  if (!listRes.ok) {
    console.warn(`[setup] Could not list users: ${listRes.statusText}`)
    return
  }

  const { users } = await listRes.json() as { users: Array<{ id: string; email: string }> }
  const existing = users.find((u) => u.email === staff.email)

  let userId: string

  if (existing) {
    userId = existing.id
    // Update password to ensure it matches our test constant
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: staff.password }),
    })
  } else {
    // Create the auth user
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: staff.email,
        password: staff.password,
        email_confirm: true,
        app_metadata: {
          role: staff.role,
          hospital_id: hospitalId,
        },
      }),
    })

    if (!createRes.ok) {
      const body = await createRes.text()
      console.warn(`[setup] Failed to create user ${staff.email}: ${body}`)
      return
    }

    const created = await createRes.json() as { id: string }
    userId = created.id
  }

  // Upsert the user_profiles row using service role Supabase client
  const upsertRes = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      full_name: staff.full_name,
      role: staff.role,
      hospital_id: hospitalId,
      is_active: true,
    }),
  })

  if (!upsertRes.ok) {
    const body = await upsertRes.text()
    console.warn(`[setup] Failed to upsert user_profile for ${staff.email}: ${body}`)
  } else {
    console.log(`[setup] Upserted staff: ${staff.email} (${staff.role})`)
  }
}

export default globalSetup
