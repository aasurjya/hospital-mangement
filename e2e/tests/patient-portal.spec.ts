/**
 * Suite 8 — Patient Portal
 *
 * Tests the patient-facing routes (/patient/*).
 *
 * IMPORTANT: Patient portal access requires:
 *   1. A user with role=PATIENT
 *   2. A patients row with user_id = that user's auth UID
 *
 * The global setup does NOT create a PATIENT account because linking a
 * patient record to an auth user requires the staff-side linking feature
 * (not yet built per CLAUDE.md). These tests are structured to:
 *   a) Skip gracefully if no patient session exists
 *   b) Verify that unauthorized access is blocked correctly
 *
 * Once a PATIENT account + linked record exists in seed data, set
 * PATIENT_EMAIL and PATIENT_PASSWORD environment variables and the tests
 * will run against real data.
 */
import { test, expect, type BrowserContext } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'

const PATIENT_EMAIL = process.env.PATIENT_EMAIL ?? ''
const PATIENT_PASSWORD = process.env.PATIENT_PASSWORD ?? ''

const hasPatientCreds = Boolean(PATIENT_EMAIL && PATIENT_PASSWORD)

/** Helper: log in as patient and return the context */
async function loginAsPatient(context: BrowserContext) {
  const page = await context.newPage()
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.loginAndWaitForRedirect(PATIENT_EMAIL, PATIENT_PASSWORD)
  return page
}

test.describe('Patient Portal', () => {
  test('non-patient staff cannot access /patient/dashboard (redirected)', async ({ page }) => {
    // This test runs with hospital-admin stored session (set via storageState in playwright.config.ts)
    // Hospital admin should NOT be able to access patient portal
    await page.goto('/patient/dashboard')
    await page.waitForURL(/\/(unauthorized|login)/, { timeout: 10_000 })
    const url = page.url()
    expect(url.includes('/unauthorized') || url.includes('/login')).toBe(true)
  })

  test.describe('With patient credentials', () => {
    test.skip(!hasPatientCreds, 'PATIENT_EMAIL / PATIENT_PASSWORD env vars not set — skipping patient portal tests')

    test('patient dashboard shows stat cards', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/dashboard')
      await page.waitForLoadState('networkidle')

      // Dashboard heading
      await expect(page.locator('h1')).toContainText('Welcome')

      // Stat cards: Next Appointment, Admission, Outstanding, Unread Messages
      await expect(page.locator(':text("Next Appointment")')).toBeVisible()
      await expect(page.locator(':text("Admission")')).toBeVisible()
      await expect(page.locator(':text("Outstanding")')).toBeVisible()
      await expect(page.locator(':text("Unread Messages")')).toBeVisible()

      // Quick actions
      await expect(page.locator('a:has-text("Book Appointment")')).toBeVisible()
      await expect(page.locator('a:has-text("View Records")')).toBeVisible()

      await ctx.close()
    })

    test('patient can view appointments list', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/appointments')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h1')).toContainText(/Appointments/i)
      await ctx.close()
    })

    test('patient can navigate to request new appointment form', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/appointments/new')
      await page.waitForLoadState('networkidle')

      // Book/request appointment form
      await expect(page.locator('h1')).toContainText(/appointment/i)
      // Doctor or department dropdown
      const dropdown = page.locator('select').first()
      await expect(dropdown).toBeVisible()

      await ctx.close()
    })

    test('patient can request a new appointment', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/appointments/new')
      await page.waitForLoadState('networkidle')

      // Select doctor/department
      const doctorSelect = page.locator('#doctor_id, select[name="doctor_id"]').first()
      if (await doctorSelect.count() > 0) {
        const opts = await doctorSelect.locator('option').count()
        if (opts > 1) await doctorSelect.selectOption({ index: 1 })
      }

      // Preferred date
      const dateInput = page.locator('#preferred_date, input[name="preferred_date"], input[type="date"]').first()
      if (await dateInput.count() > 0) {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        await dateInput.fill(nextWeek.toISOString().slice(0, 10))
      }

      // Reason
      const reasonInput = page.locator('#reason, textarea[name="reason"]').first()
      if (await reasonInput.count() > 0) {
        await reasonInput.fill('E2E patient appointment request')
      }

      await page.click('button[type="submit"]')
      await page.waitForURL(/\/patient\/appointments($|\/)/, { timeout: 15_000 })

      await ctx.close()
    })

    test('patient can cancel a scheduled appointment', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/appointments')
      await page.waitForLoadState('networkidle')

      const cancelBtn = page.locator('button:has-text("Cancel"), a:has-text("Cancel appointment")').first()
      if (await cancelBtn.count() === 0) {
        await ctx.close()
        test.skip(true, 'No scheduled appointments to cancel')
        return
      }

      page.once('dialog', (d) => d.accept())
      await cancelBtn.click()
      await page.waitForLoadState('networkidle')

      await ctx.close()
    })

    test('patient can view admissions', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/admissions')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h1')).toContainText(/Admissions/i)
      await ctx.close()
    })

    test('patient can view medical records (finalized only)', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/records')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h1')).toContainText(/Records/i)

      // Draft records should not appear for patients
      const draftText = page.locator(':text("Draft"), :text("DRAFT")')
      await expect(draftText).toHaveCount(0)

      await ctx.close()
    })

    test('patient can view billing and invoices', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/billing')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h1')).toContainText(/Billing|Invoices/i)
      await ctx.close()
    })

    test('patient can edit profile contact info', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/profile')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h1')).toContainText(/Profile/i)

      // Phone input
      const phoneInput = page.locator('#phone, input[name="phone"]').first()
      if (await phoneInput.count() > 0) {
        await phoneInput.fill('+254700123999')
        await page.click('button[type="submit"]')
        await page.waitForLoadState('networkidle')
        // Success indicator
        const successEl = page.locator('[role="status"], [role="alert"]:has-text("saved"), :text("saved"), :text("updated")').first()
        await expect(successEl).toBeVisible()
      }

      await ctx.close()
    })

    test('patient can view visit history timeline', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/history')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h1')).toContainText(/History|Timeline/i)
      await ctx.close()
    })

    test('patient can submit feedback with star rating', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/feedback')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h1')).toContainText(/Feedback/i)

      // Star rating buttons (may use radio inputs or buttons labeled 1-5)
      const ratingInput = page.locator('input[type="radio"][name*="rating"], button[aria-label*="star"], button:has-text("4"), button:has-text("5")').first()
      if (await ratingInput.count() > 0) {
        await ratingInput.click()
      }

      // Comment
      const commentInput = page.locator('#comment, textarea[name="comment"], textarea').first()
      if (await commentInput.count() > 0) {
        await commentInput.fill('E2E test feedback comment — great service.')
      }

      const submitBtn = page.locator('button[type="submit"]')
      await expect(submitBtn).toBeVisible()
      await submitBtn.click()
      await page.waitForLoadState('networkidle')

      await ctx.close()
    })

    test('patient can access document upload page', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/documents')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h1')).toContainText(/Documents/i)

      // File input should be present
      const fileInput = page.locator('input[type="file"]')
      await expect(fileInput).toBeVisible()

      await ctx.close()
    })

    test('patient can access chat page', async ({ browser }) => {
      const ctx = await browser.newContext()
      const page = await loginAsPatient(ctx)

      await page.goto('/patient/chat')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('h1, [role="heading"]').first()).toBeVisible()
      await ctx.close()
    })
  })
})
