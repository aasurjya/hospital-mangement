/**
 * Suite 9 — AI Clinical Assistant
 *
 * Tests the /hospital/ai page:
 *   - DOCTOR can access it
 *   - When ANTHROPIC_API_KEY is not set, shows "not configured" message
 *   - Tab rendering (SOAP, Diagnosis, Drug check, Summary)
 *   - Non-DOCTOR role is blocked
 *
 * These tests use the stored doctor session. The hospital-admin session is
 * used for the RBAC enforcement test.
 */
import { test, expect } from '@playwright/test'

// Tests in this file use the doctor storageState defined in playwright.config.ts
// for the ai-assistant-tests project.

test.describe('AI Clinical Assistant', () => {
  test('doctor can access /hospital/ai page', async ({ page }) => {
    await page.goto('/hospital/ai')
    await page.waitForLoadState('networkidle')

    // Should not be redirected to /unauthorized
    await expect(page).not.toHaveURL(/\/unauthorized/)
    await expect(page.locator('h1')).toContainText('AI Clinical Assistant')
  })

  test('shows "not configured" banner when API key is absent', async ({ page }) => {
    await page.goto('/hospital/ai')
    await page.waitForLoadState('networkidle')

    // The app should either show the tabs (configured) or the info banner (not configured)
    const configuredTabs = page.locator('button:has-text("SOAP"), a:has-text("SOAP"), [role="tab"]:has-text("SOAP")').first()
    const notConfiguredBanner = page.locator(':text("AI features are not configured"), :text("not configured")').first()

    const isConfigured = (await configuredTabs.count()) > 0
    const isNotConfigured = (await notConfiguredBanner.count()) > 0

    // One of these must be true
    expect(isConfigured || isNotConfigured).toBe(true)

    if (isNotConfigured) {
      // Verify the ANTHROPIC_API_KEY message is shown
      await expect(notConfiguredBanner).toBeVisible()
      await expect(page.locator(':text("ANTHROPIC_API_KEY")')).toBeVisible()
    }
  })

  test('SOAP tab renders with patient ID and observations inputs (when configured)', async ({ page }) => {
    await page.goto('/hospital/ai')
    await page.waitForLoadState('networkidle')

    // Skip if not configured
    const notConfigured = await page.locator(':text("not configured")').count()
    if (notConfigured > 0) {
      test.skip(true, 'AI not configured — skipping tab tests')
      return
    }

    // Navigate to SOAP tab
    const soapTab = page.locator('button:has-text("SOAP"), a:has-text("SOAP"), [role="tab"]:has-text("SOAP")').first()
    await soapTab.click()

    // Patient ID input
    const patientInput = page.locator(
      '#patient_id, input[name="patient_id"], input[placeholder*="patient" i]'
    ).first()
    await expect(patientInput).toBeVisible()

    // Observations / subjective textarea
    const observationsInput = page.locator(
      '#observations, textarea[name="observations"], textarea[placeholder*="observation" i], textarea[placeholder*="subjective" i]'
    ).first()
    await expect(observationsInput).toBeVisible()
  })

  test('Diagnosis tab renders with input fields (when configured)', async ({ page }) => {
    await page.goto('/hospital/ai')
    await page.waitForLoadState('networkidle')

    const notConfigured = await page.locator(':text("not configured")').count()
    if (notConfigured > 0) {
      test.skip(true, 'AI not configured — skipping tab tests')
      return
    }

    const diagnosisTab = page.locator(
      'button:has-text("Diagnosis"), a:has-text("Diagnosis"), [role="tab"]:has-text("Diagnosis")'
    ).first()
    await diagnosisTab.click()

    // Should have at least a text area or input for symptoms
    const inputEl = page.locator('textarea, input[type="text"]').first()
    await expect(inputEl).toBeVisible()
  })

  test('Drug check tab renders with medication inputs (when configured)', async ({ page }) => {
    await page.goto('/hospital/ai')
    await page.waitForLoadState('networkidle')

    const notConfigured = await page.locator(':text("not configured")').count()
    if (notConfigured > 0) {
      test.skip(true, 'AI not configured — skipping tab tests')
      return
    }

    const drugTab = page.locator(
      'button:has-text("Drug"), a:has-text("Drug"), [role="tab"]:has-text("Drug")'
    ).first()
    if (await drugTab.count() > 0) {
      await drugTab.click()
      const inputEl = page.locator('textarea, input[type="text"]').first()
      await expect(inputEl).toBeVisible()
    }
  })

  test('Patient summary tab renders (when configured)', async ({ page }) => {
    await page.goto('/hospital/ai')
    await page.waitForLoadState('networkidle')

    const notConfigured = await page.locator(':text("not configured")').count()
    if (notConfigured > 0) {
      test.skip(true, 'AI not configured — skipping tab tests')
      return
    }

    const summaryTab = page.locator(
      'button:has-text("Summary"), a:has-text("Summary"), [role="tab"]:has-text("Summary")'
    ).first()
    if (await summaryTab.count() > 0) {
      await summaryTab.click()
      await page.waitForLoadState('domcontentloaded')
      // Tab content area is visible
      await expect(page.locator('main, [role="main"], form').first()).toBeVisible()
    }
  })

  test('page has AI disclaimer when configured', async ({ page }) => {
    await page.goto('/hospital/ai')
    await page.waitForLoadState('networkidle')

    const notConfigured = await page.locator(':text("not configured")').count()
    if (notConfigured > 0) {
      test.skip(true, 'AI not configured — skipping disclaimer test')
      return
    }

    // Disclaimer about human review
    const disclaimer = page.locator(':text("human review"), :text("clinician"), :text("review")').first()
    await expect(disclaimer).toBeVisible()
  })
})

// Separate project config needed for the non-doctor test — use a hospital-admin
// session which is already available via the platform-admin storageState.
// We override the storageState inline.
test.describe('AI Assistant RBAC — non-DOCTOR blocked', () => {
  test.use({ storageState: 'e2e/fixtures/.auth/hospital-admin.json' })

  test('hospital admin (non-doctor) cannot access /hospital/ai (redirected to /unauthorized)', async ({ page }) => {
    await page.goto('/hospital/ai')
    await page.waitForURL(/\/(unauthorized|login)/, { timeout: 10_000 })
    const url = page.url()
    expect(url.includes('/unauthorized') || url.includes('/login')).toBe(true)
  })
})
