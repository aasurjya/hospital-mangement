import type { Page, Locator } from '@playwright/test'

/**
 * POM for /hospital/billing and sub-pages.
 */
export class BillingPage {
  readonly page: Page
  readonly heading: Locator
  readonly newInvoiceButton: Locator
  readonly invoicesTable: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h1')
    this.newInvoiceButton = page.locator('a:has-text("New invoice")')
    this.invoicesTable = page.locator('[aria-label="Invoices"]')
  }

  async goto() {
    await this.page.goto('/hospital/billing')
    await this.page.waitForLoadState('networkidle')
  }

  async clickNewInvoice() {
    await this.newInvoiceButton.click()
    await this.page.waitForURL('**/billing/new')
    await this.page.waitForLoadState('networkidle')
  }

  async selectPatient(nameOrMrn: string) {
    // The new invoice form uses a select or combobox for patient
    const select = this.page.locator('#patient_id, select[name="patient_id"]').first()
    await select.selectOption({ label: nameOrMrn })
  }

  async addLineItem(description: string, quantity: string, unitPrice: string, index = 0) {
    const descInputs = this.page.locator('input[name*="description"], input[placeholder*="description" i]')
    const qtyInputs = this.page.locator('input[name*="quantity"], input[placeholder*="qty" i]')
    const priceInputs = this.page.locator('input[name*="unit_price"], input[placeholder*="price" i]')

    await descInputs.nth(index).fill(description)
    await qtyInputs.nth(index).fill(quantity)
    await priceInputs.nth(index).fill(unitPrice)
  }

  async submitInvoiceForm() {
    await this.page.click('button[type="submit"]')
  }

  async waitForInvoiceDetail(): Promise<string> {
    await this.page.waitForURL('**/billing/**', { timeout: 15_000 })
    const url = this.page.url()
    const match = url.match(/\/billing\/([^/]+)$/)
    if (!match) throw new Error(`Could not extract invoice ID from: ${url}`)
    return match[1]
  }

  /** Click the "Issue" action button on an invoice detail page */
  async clickIssue() {
    await this.page.locator('button:has-text("Issue"), a:has-text("Issue")').first().click()
  }

  /** Click the "Record payment" button */
  async clickRecordPayment() {
    await this.page.locator('button:has-text("Record payment"), a:has-text("Record payment")').first().click()
  }

  /** Click the "Void" action button */
  async clickVoid() {
    await this.page.locator('button:has-text("Void"), a:has-text("Void")').first().click()
  }
}
