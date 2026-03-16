import type { Page, Locator } from '@playwright/test'

/**
 * POM for /hospital/patients and sub-pages.
 */
export class PatientsPage {
  readonly page: Page
  readonly heading: Locator
  readonly registerPatientButton: Locator
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly patientsTable: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h1')
    this.registerPatientButton = page.locator('a:has-text("Register patient")')
    this.searchInput = page.locator('#patient-search')
    this.searchButton = page.locator('button:has-text("Search")')
    this.patientsTable = page.locator('[aria-label="Patients"]')
  }

  async goto() {
    await this.page.goto('/hospital/patients')
    await this.page.waitForLoadState('networkidle')
  }

  async clickRegisterPatient() {
    await this.registerPatientButton.click()
    await this.page.waitForURL('**/patients/new')
  }

  async fillNewPatientForm(opts: {
    fullName: string
    dateOfBirth?: string
    gender?: string
    phone?: string
    email?: string
  }) {
    await this.page.fill('#full_name', opts.fullName)
    if (opts.dateOfBirth) {
      await this.page.fill('#date_of_birth', opts.dateOfBirth)
    }
    if (opts.gender) {
      await this.page.selectOption('#gender', opts.gender)
    }
    if (opts.phone) {
      await this.page.fill('#phone', opts.phone)
    }
    if (opts.email) {
      await this.page.fill('#email', opts.email)
    }
  }

  async submitNewPatientForm() {
    await this.page.click('button[type="submit"]')
  }

  /** After successful registration, extracts the MRN from the patient detail page URL */
  async waitForPatientDetailAndGetId(): Promise<string> {
    await this.page.waitForURL('**/patients/**', { timeout: 10_000 })
    const url = this.page.url()
    const match = url.match(/\/patients\/([^/]+)$/)
    if (!match) throw new Error(`Could not extract patient ID from: ${url}`)
    return match[1]
  }

  async searchFor(query: string) {
    await this.searchInput.fill(query)
    await this.searchButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async clickPatientByName(name: string) {
    await this.page.locator(`a:has-text("${name}")`).first().click()
  }
}
