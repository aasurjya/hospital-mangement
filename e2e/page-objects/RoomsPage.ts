import type { Page, Locator } from '@playwright/test'

/**
 * POM for /hospital/rooms and sub-pages.
 */
export class RoomsPage {
  readonly page: Page
  readonly heading: Locator
  readonly addRoomsButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.locator('h1')
    this.addRoomsButton = page.locator('a:has-text("Add rooms")')
  }

  async goto() {
    await this.page.goto('/hospital/rooms')
    await this.page.waitForLoadState('networkidle')
  }

  async clickAddRooms() {
    await this.addRoomsButton.click()
    await this.page.waitForURL('**/rooms/new')
  }

  async fillRoomConfigForm(opts: {
    roomType: string
    prefix: string
    quantity: string
    floor?: string
    notes?: string
  }) {
    await this.page.selectOption('#room_type', opts.roomType)
    await this.page.fill('#prefix', opts.prefix)
    await this.page.fill('#quantity', opts.quantity)
    if (opts.floor) {
      await this.page.fill('#floor', opts.floor)
    }
    if (opts.notes) {
      await this.page.fill('#notes', opts.notes)
    }
  }

  /** Submit the configure step to get to preview */
  async clickContinueToPreview() {
    await this.page.click('button:has-text("Continue to preview")')
    // Wait for the preview section to appear
    await this.page.locator('h2').filter({ hasText: /rooms? will be created/i }).waitFor({ timeout: 10_000 })
  }

  /** Submit the preview step to actually create rooms */
  async clickCreateRooms() {
    await this.page.click('button:has-text("Create")')
    await this.page.waitForURL('**/hospital/rooms', { timeout: 15_000 })
  }

  async filterByType(type: string) {
    await this.page.locator(`[aria-label="Filter by room type"] a:has-text("${type}")`).click()
    await this.page.waitForLoadState('networkidle')
  }

  async filterByAvailability(label: 'Available' | 'Unavailable' | 'All') {
    await this.page.locator(`[aria-label="Filter by availability"] a:has-text("${label}")`).click()
    await this.page.waitForLoadState('networkidle')
  }
}
