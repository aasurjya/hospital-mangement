import type { Page, Locator } from '@playwright/test'

/**
 * POM for /platform/hospitals and hospital detail pages.
 */
export class PlatformHospitalsPage {
  readonly page: Page
  readonly heading: Locator
  readonly addHospitalButton: Locator
  readonly hospitalsTable: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h1')
    this.addHospitalButton = page.locator('a:has-text("Add hospital")')
    this.hospitalsTable = page.locator('table')
  }

  async goto() {
    await this.page.goto('/platform/hospitals')
    await this.page.waitForLoadState('networkidle')
  }

  async clickAddHospital() {
    await this.addHospitalButton.click()
    await this.page.waitForURL('**/hospitals/new')
  }

  async fillNewHospitalForm(name: string, slug?: string) {
    await this.page.fill('#name', name)
    if (slug) {
      const slugField = this.page.locator('#slug')
      if (await slugField.count() > 0) {
        await slugField.fill(slug)
      }
    }
  }

  async submitNewHospitalForm() {
    await this.page.click('button[type="submit"]')
  }

  async clickHospitalByName(name: string) {
    await this.page.locator(`a:has-text("${name}")`).first().click()
  }

  /** Returns the href of the first hospital link matching the name */
  async getHospitalHref(name: string): Promise<string | null> {
    const link = this.page.locator(`a:has-text("${name}")`).first()
    return link.getAttribute('href')
  }
}
