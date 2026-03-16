/**
 * Suite 7 — Reports
 *
 * Verifies all 5 report tabs render their stat cards and tables,
 * and that the CSV export link is present.
 *
 * Uses hospital-admin session (HOSPITAL_ADMIN has canViewReports access).
 */
import { test, expect, type Download } from '@playwright/test'

test.describe('Reports', () => {
  test('reports page loads and shows the "Occupancy" tab by default', async ({ page }) => {
    await page.goto('/hospital/reports')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('Reports')
    // Export CSV button
    await expect(page.locator('a:has-text("Export CSV")')).toBeVisible()
    // Occupancy tab should be active
    await expect(page.locator('[aria-current="page"], .active, [data-active="true"]').filter({ hasText: /Occupancy/i }).first()).toBeVisible()
  })

  test('occupancy tab renders stat cards', async ({ page }) => {
    await page.goto('/hospital/reports?tab=occupancy')
    await page.waitForLoadState('networkidle')

    // Stat cards: Total Rooms, Occupied, Available, Occupancy Rate
    await expect(page.locator(':text("Total Rooms")')).toBeVisible()
    await expect(page.locator(':text("Occupied")')).toBeVisible()
    await expect(page.locator(':text("Available")')).toBeVisible()
    await expect(page.locator(':text("Occupancy Rate")')).toBeVisible()
  })

  test('occupancy tab renders the room type breakdown table', async ({ page }) => {
    await page.goto('/hospital/reports?tab=occupancy')
    await page.waitForLoadState('networkidle')

    // Table or empty state — both are valid
    const hasTable = (await page.locator('[aria-label="Occupancy by room type"]').count()) > 0
    const hasEmpty = (await page.locator(':text("No rooms found")').count()) > 0
    expect(hasTable || hasEmpty).toBe(true)
  })

  test('financial tab renders with period selector', async ({ page }) => {
    await page.goto('/hospital/reports?tab=financial')
    await page.waitForLoadState('networkidle')

    // Financial stat cards
    await expect(page.locator(':text("Revenue")')).toBeVisible()
    await expect(page.locator(':text("Outstanding")')).toBeVisible()
    await expect(page.locator(':text("Invoices")')).toBeVisible()
    await expect(page.locator(':text("Paid")')).toBeVisible()

    // Period selector links (this_month, last_month, etc.)
    const periodLinks = page.locator('a:has-text("This month"), a:has-text("Last month"), a:has-text("Last 7 days"), a:has-text("Today")')
    // At least one period filter exists
    const count = await periodLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('financial tab: changing period updates URL', async ({ page }) => {
    await page.goto('/hospital/reports?tab=financial')
    await page.waitForLoadState('networkidle')

    // Click "Last month" if visible
    const lastMonthLink = page.locator('a:has-text("Last month")').first()
    if (await lastMonthLink.count() > 0) {
      await lastMonthLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/period=last_month/)
    }
  })

  test('patients tab renders stat cards', async ({ page }) => {
    await page.goto('/hospital/reports?tab=patients')
    await page.waitForLoadState('networkidle')

    await expect(page.locator(':text("Admissions")')).toBeVisible()
    await expect(page.locator(':text("Discharges")')).toBeVisible()
    await expect(page.locator(':text("New Patients")')).toBeVisible()
  })

  test('appointments tab renders stat cards', async ({ page }) => {
    await page.goto('/hospital/reports?tab=appointments')
    await page.waitForLoadState('networkidle')

    await expect(page.locator(':text("Total")')).toBeVisible()
    await expect(page.locator(':text("Completed")')).toBeVisible()
    await expect(page.locator(':text("No-Shows")')).toBeVisible()
    await expect(page.locator(':text("No-Show Rate")')).toBeVisible()
  })

  test('staff tab renders doctor workload table or empty state', async ({ page }) => {
    await page.goto('/hospital/reports?tab=staff')
    await page.waitForLoadState('networkidle')

    const hasTable = (await page.locator('[aria-label="Staff workload"]').count()) > 0
    const hasEmpty = (await page.locator(':text("No doctors found")').count()) > 0
    expect(hasTable || hasEmpty).toBe(true)
  })

  test('export CSV button triggers a file download', async ({ page }) => {
    await page.goto('/hospital/reports?tab=occupancy')
    await page.waitForLoadState('networkidle')

    // Set up download promise before clicking
    const downloadPromise: Promise<Download> = page.waitForEvent('download', { timeout: 15_000 })

    await page.locator('a:has-text("Export CSV")').click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.csv$/i)
  })

  test('switching tabs updates the active tab indicator', async ({ page }) => {
    await page.goto('/hospital/reports?tab=occupancy')
    await page.waitForLoadState('networkidle')

    // Navigate to financial tab
    const financialTab = page.locator('a:has-text("Financial"), button:has-text("Financial")').first()
    await financialTab.click()
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(/tab=financial/)
  })
})
