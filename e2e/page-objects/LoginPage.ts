import type { Page, Locator } from '@playwright/test'

/**
 * Page Object Model for /login.
 *
 * Wraps every interaction with the login form so tests stay readable and
 * changes to selectors propagate from a single place.
 */
export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('#email')
    this.passwordInput = page.locator('#password')
    this.submitButton = page.locator('button[type="submit"]')
    this.errorAlert = page.locator('[role="alert"]')
  }

  async goto() {
    await this.page.goto('/login')
    await this.page.waitForLoadState('domcontentloaded')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async loginAndWaitForRedirect(email: string, password: string) {
    await this.login(email, password)
    await this.page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 15_000,
    })
  }

  async getErrorText(): Promise<string> {
    await this.errorAlert.waitFor({ state: 'visible' })
    return this.errorAlert.innerText()
  }
}
