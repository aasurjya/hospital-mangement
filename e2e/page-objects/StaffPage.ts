import type { Page, Locator } from '@playwright/test'

/**
 * POM for /hospital/staff and sub-pages.
 */
export class StaffPage {
  readonly page: Page
  readonly heading: Locator
  readonly addStaffButton: Locator
  readonly staffTable: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h1')
    this.addStaffButton = page.locator('a:has-text("Add staff member")')
    this.staffTable = page.locator('[aria-label="Staff members"]')
  }

  async goto() {
    await this.page.goto('/hospital/staff')
    await this.page.waitForLoadState('networkidle')
  }

  async clickAddStaff() {
    await this.addStaffButton.click()
    await this.page.waitForURL('**/staff/new')
  }

  async fillNewStaffForm(opts: {
    fullName: string
    email: string
    role: string
    phone?: string
  }) {
    await this.page.fill('#full_name', opts.fullName)
    await this.page.fill('#email', opts.email)
    await this.page.selectOption('#role', opts.role)
    if (opts.phone) {
      await this.page.fill('#phone', opts.phone)
    }
  }

  async submitNewStaffForm() {
    await this.page.click('button[type="submit"]')
  }

  /** Returns the temp password shown in the success state */
  async getTempPassword(): Promise<string> {
    const codeEl = this.page.locator('code').first()
    await codeEl.waitFor({ state: 'visible', timeout: 10_000 })
    return codeEl.innerText()
  }

  async clickEditForStaff(name: string) {
    const row = this.page.locator('tr').filter({ hasText: name })
    await row.locator('a:has-text("Edit")').click()
  }
}
