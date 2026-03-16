/**
 * Suite 3 — Staff Management
 *
 * Tests hospital admin capabilities for staff CRUD.
 * Runs in serial mode — creation comes before edit/deactivation.
 *
 * Uses the stored hospital-admin session.
 */
import { test, expect } from '@playwright/test'
import { StaffPage } from '../page-objects/StaffPage'

const RUN_ID = Date.now()
const STAFF_NAME = `E2E Staff Member ${RUN_ID}`
const STAFF_EMAIL = `e2e-new-staff-${RUN_ID}@test.local`

test.describe.configure({ mode: 'serial' })

test.describe('Staff Management', () => {
  test('hospital admin can view staff list', async ({ page }) => {
    const staffPage = new StaffPage(page)
    await staffPage.goto()

    await expect(staffPage.heading).toContainText('Staff')
    await expect(staffPage.addStaffButton).toBeVisible()
  })

  test('hospital admin can navigate to new staff form', async ({ page }) => {
    const staffPage = new StaffPage(page)
    await staffPage.goto()
    await staffPage.clickAddStaff()

    await expect(page).toHaveURL(/\/staff\/new/)
    await expect(page.locator('h1')).toContainText('Add staff member')
    await expect(page.locator('#full_name')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#role')).toBeVisible()
  })

  test('new staff form shows validation error when required fields are empty', async ({ page }) => {
    await page.goto('/hospital/staff/new')
    await page.waitForLoadState('networkidle')

    // Submit without filling anything
    await page.click('button[type="submit"]')

    // Browser native validation on #full_name (required)
    const nameValidity = await page.locator('#full_name').evaluate(
      (el: HTMLInputElement) => el.validity.valid
    )
    expect(nameValidity).toBe(false)
  })

  test('can create a new staff member and see temp password', async ({ page }) => {
    const staffPage = new StaffPage(page)
    await staffPage.goto()
    await staffPage.clickAddStaff()

    await staffPage.fillNewStaffForm({
      fullName: STAFF_NAME,
      email: STAFF_EMAIL,
      role: 'NURSE',
      phone: '+254700000099',
    })
    await staffPage.submitNewStaffForm()

    // Success state: account created banner
    const successBanner = page.locator('[role="status"]')
    await successBanner.waitFor({ state: 'visible', timeout: 15_000 })
    await expect(successBanner).toContainText('Account created')
    await expect(successBanner).toContainText(STAFF_NAME)

    // Temp password shown in code element
    const tempPassword = await staffPage.getTempPassword()
    expect(tempPassword.length).toBeGreaterThan(6)

    // "Shown once only" warning
    await expect(page.locator('text=Not shown again')).toBeVisible()
  })

  test('newly created staff appears in the staff list', async ({ page }) => {
    const staffPage = new StaffPage(page)
    await staffPage.goto()

    await expect(page.locator(`td:has-text("${STAFF_NAME}")`)).toBeVisible()
  })

  test('can navigate to edit page for a staff member', async ({ page }) => {
    const staffPage = new StaffPage(page)
    await staffPage.goto()
    await staffPage.clickEditForStaff(STAFF_NAME)

    await page.waitForURL(/\/staff\/.*\/edit/, { timeout: 10_000 })
    await expect(page.locator('h1')).toContainText(/Edit/)
  })

  test('edit form is pre-filled with existing staff data', async ({ page }) => {
    const staffPage = new StaffPage(page)
    await staffPage.goto()
    await staffPage.clickEditForStaff(STAFF_NAME)
    await page.waitForURL(/\/staff\/.*\/edit/)

    // Full name field should be pre-filled
    const fullNameInput = page.locator('#full_name, input[name="full_name"]').first()
    await expect(fullNameInput).toHaveValue(STAFF_NAME)
  })

  test('can reset staff password from edit page', async ({ page }) => {
    const staffPage = new StaffPage(page)
    await staffPage.goto()
    await staffPage.clickEditForStaff(STAFF_NAME)
    await page.waitForURL(/\/staff\/.*\/edit/)

    // Look for a "Reset password" button
    const resetButton = page.locator('button:has-text("Reset password"), a:has-text("Reset password")').first()
    await expect(resetButton).toBeVisible()

    // Intercept the confirm dialog and accept it
    page.once('dialog', (dialog) => dialog.accept())
    await resetButton.click()

    // After reset, a new temp password should appear
    const resultBanner = page.locator('[role="alert"], [role="status"]').first()
    await resultBanner.waitFor({ state: 'visible', timeout: 10_000 })
    // Banner should contain either the new password or a success message
    const bannerText = await resultBanner.innerText()
    expect(bannerText.length).toBeGreaterThan(5)
  })

  test('can deactivate a staff member from edit page', async ({ page }) => {
    const staffPage = new StaffPage(page)
    await staffPage.goto()
    await staffPage.clickEditForStaff(STAFF_NAME)
    await page.waitForURL(/\/staff\/.*\/edit/)

    const deactivateButton = page.locator(
      'button:has-text("Deactivate"), a:has-text("Deactivate")'
    ).first()
    await expect(deactivateButton).toBeVisible()

    // Accept the confirmation dialog
    page.once('dialog', (dialog) => dialog.accept())
    await deactivateButton.click()

    // Should redirect back to staff list (or show inactive badge)
    await page.waitForURL(/\/hospital\/staff($|\?)/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/hospital\/staff/)
  })
})
