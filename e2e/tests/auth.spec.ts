/**
 * Suite 1 — Auth
 *
 * Tests login page rendering, valid/invalid login, logout, and
 * unauthenticated redirect behaviour.
 *
 * These tests intentionally do NOT use stored session state — they test
 * the authentication flow itself.
 */
import { test, expect } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'
import { PLATFORM_ADMIN } from '../fixtures/test-data'

test.describe('Auth', () => {
  test('login page renders correctly', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await expect(page).toHaveTitle(/Sign In/)
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
    await expect(loginPage.submitButton).toHaveText('Sign in')

    // WCAG: inputs have associated labels
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    await loginPage.login('nonexistent@example.com', 'wrongpassword')

    // Button shows loading state briefly, then error appears
    const errorText = await loginPage.getErrorText()
    expect(errorText).toContain('Invalid email or password')
  })

  test('shows validation error for empty fields', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()

    // Submit with empty email
    await loginPage.passwordInput.fill('somepassword')
    await loginPage.submitButton.click()

    // Browser native validation prevents submission — email field is :invalid
    const emailValidity = await loginPage.emailInput.evaluate(
      (el: HTMLInputElement) => el.validity.valid
    )
    expect(emailValidity).toBe(false)
  })

  test('platform admin logs in and is redirected to /platform/hospitals', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAndWaitForRedirect(PLATFORM_ADMIN.email, PLATFORM_ADMIN.password)

    await expect(page).toHaveURL(/\/platform\/hospitals/)
    await expect(page.locator('h1')).toContainText('Hospitals')
  })

  test('unauthenticated user is redirected to /login when accessing protected route', async ({ page }) => {
    // No stored session — fresh context
    await page.goto('/hospital/dashboard')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user is redirected to /login when accessing platform route', async ({ page }) => {
    await page.goto('/platform/hospitals')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated user is redirected to /login when accessing patient route', async ({ page }) => {
    await page.goto('/patient/dashboard')
    await page.waitForURL(/\/login/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('logout works and redirects to /login', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAndWaitForRedirect(PLATFORM_ADMIN.email, PLATFORM_ADMIN.password)

    // Find and click the logout button/link
    const logoutEl = page.locator(
      'a:has-text("Logout"), a:has-text("Log out"), a:has-text("Sign out"), button:has-text("Logout"), button:has-text("Log out"), button:has-text("Sign out")'
    ).first()
    await logoutEl.waitFor({ state: 'visible', timeout: 10_000 })
    await logoutEl.click()

    await page.waitForURL(/\/login/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('/dashboard redirects platform admin to /platform/hospitals', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAndWaitForRedirect(PLATFORM_ADMIN.email, PLATFORM_ADMIN.password)

    // Navigate to the generic /dashboard
    await page.goto('/dashboard')
    await page.waitForURL(/\/platform\/hospitals/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/platform\/hospitals/)
  })
})
