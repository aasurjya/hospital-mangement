/**
 * Suite 2 — Platform Admin
 *
 * Tests for platform admin capabilities:
 *   - View hospital list
 *   - Create a new hospital
 *   - View hospital detail
 *   - Edit hospital
 *   - Cannot access /hospital/* routes
 *
 * Uses the stored platform-admin session from global setup.
 * Tests run in serial mode — hospital creation happens once and later tests
 * depend on that hospital existing.
 */
import { test, expect } from '@playwright/test'
import { PlatformHospitalsPage } from '../page-objects/PlatformHospitalsPage'

// Unique suffix prevents conflicts when tests are re-run without a DB reset
const RUN_ID = Date.now()
const HOSPITAL_NAME = `PlatformTest Hospital ${RUN_ID}`
const HOSPITAL_SLUG = `platform-test-${RUN_ID}`

test.describe.configure({ mode: 'serial' })

test.describe('Platform Admin — Hospitals', () => {
  let createdHospitalHref: string

  test('can access /platform/hospitals and see the hospitals heading', async ({ page }) => {
    const hospitalsPage = new PlatformHospitalsPage(page)
    await hospitalsPage.goto()

    await expect(page.locator('h1')).toContainText('Hospitals')
    // "Add hospital" button is present
    await expect(hospitalsPage.addHospitalButton).toBeVisible()
  })

  test('can navigate to the new hospital form', async ({ page }) => {
    const hospitalsPage = new PlatformHospitalsPage(page)
    await hospitalsPage.goto()
    await hospitalsPage.clickAddHospital()

    await expect(page).toHaveURL(/\/hospitals\/new/)
    // Form heading
    await expect(page.locator('h1')).toBeVisible()
    // Name field
    await expect(page.locator('#name, input[name="name"]').first()).toBeVisible()
  })

  test('can create a new hospital', async ({ page }) => {
    const hospitalsPage = new PlatformHospitalsPage(page)
    await hospitalsPage.goto()
    await hospitalsPage.clickAddHospital()

    await hospitalsPage.fillNewHospitalForm(HOSPITAL_NAME, HOSPITAL_SLUG)
    await hospitalsPage.submitNewHospitalForm()

    // Should redirect to the detail page for the new hospital
    await page.waitForURL(/\/platform\/hospitals\/[^/]+$/, { timeout: 15_000 })
    await expect(page.locator('h1, h2').first()).toContainText(HOSPITAL_NAME)
  })

  test('newly created hospital appears in the list', async ({ page }) => {
    const hospitalsPage = new PlatformHospitalsPage(page)
    await hospitalsPage.goto()

    const link = page.locator(`a:has-text("${HOSPITAL_NAME}")`).first()
    await expect(link).toBeVisible()

    createdHospitalHref = (await link.getAttribute('href')) ?? ''
    expect(createdHospitalHref).toMatch(/\/platform\/hospitals\//)
  })

  test('can view hospital detail page', async ({ page }) => {
    const hospitalsPage = new PlatformHospitalsPage(page)
    await hospitalsPage.goto()
    await hospitalsPage.clickHospitalByName(HOSPITAL_NAME)

    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1, h2').first()).toContainText(HOSPITAL_NAME)

    // Detail page should show admins section or edit link
    const editLink = page.locator('a:has-text("Edit")')
    const adminsSection = page.locator(':text("Admins"), :text("Admin")')
    const hasEditOrAdmins = (await editLink.count()) > 0 || (await adminsSection.count()) > 0
    expect(hasEditOrAdmins).toBe(true)
  })

  test('can navigate to edit hospital form', async ({ page }) => {
    const hospitalsPage = new PlatformHospitalsPage(page)
    await hospitalsPage.goto()
    await hospitalsPage.clickHospitalByName(HOSPITAL_NAME)
    await page.waitForLoadState('networkidle')

    const editLink = page.locator('a:has-text("Edit")').first()
    await editLink.click()
    await page.waitForURL(/\/edit/, { timeout: 10_000 })

    // Form should be visible with the hospital name
    await expect(page.locator('input[name="name"], #name').first()).toHaveValue(HOSPITAL_NAME)
  })

  test('platform admin cannot access /hospital/* staff routes (redirected to unauthorized or login)', async ({ page }) => {
    await page.goto('/hospital/dashboard')
    await page.waitForURL(/\/(unauthorized|login)/, { timeout: 10_000 })

    const finalUrl = page.url()
    const isBlocked = finalUrl.includes('/unauthorized') || finalUrl.includes('/login')
    expect(isBlocked).toBe(true)
  })

  test('platform admin cannot access /hospital/staff (redirected)', async ({ page }) => {
    await page.goto('/hospital/staff')
    await page.waitForURL(/\/(unauthorized|login)/, { timeout: 10_000 })
  })
})
