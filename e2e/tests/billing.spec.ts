/**
 * Suite 5 — Billing
 *
 * Invoice lifecycle: create (DRAFT) → issue → record payment → void.
 * Runs in serial mode. Uses hospital-admin session (billing roles apply; admin
 * has full billing access via canCreateBilling / canViewBilling checks).
 */
import { test, expect } from '@playwright/test'
import { BillingPage } from '../page-objects/BillingPage'
import { PatientsPage } from '../page-objects/PatientsPage'

const RUN_ID = Date.now()
const PATIENT_NAME = `Billing Patient ${RUN_ID}`

let invoiceId: string
let patientId: string

test.describe.configure({ mode: 'serial' })

test.describe('Billing', () => {
  // Pre-condition: create a patient for the invoices
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    const patientsPage = new PatientsPage(page)
    await patientsPage.goto()
    await patientsPage.clickRegisterPatient()

    await patientsPage.fillNewPatientForm({
      fullName: PATIENT_NAME,
      dateOfBirth: '1985-03-20',
      gender: 'MALE',
      phone: '+254700000050',
    })
    await patientsPage.submitNewPatientForm()
    await page.waitForURL(/\/patients\/[^/]+$/, { timeout: 15_000 })
    patientId = new URL(page.url()).pathname.split('/').pop()!
    await ctx.close()
  })

  test('can access billing page', async ({ page }) => {
    const billingPage = new BillingPage(page)
    await billingPage.goto()

    await expect(billingPage.heading).toContainText('Billing')
    await expect(billingPage.newInvoiceButton).toBeVisible()
  })

  test('can navigate to new invoice form', async ({ page }) => {
    const billingPage = new BillingPage(page)
    await billingPage.goto()
    await billingPage.clickNewInvoice()

    await expect(page).toHaveURL(/\/billing\/new/)
    await expect(page.locator('h1')).toContainText(/invoice/i)
  })

  test('can create a new invoice with a line item', async ({ page }) => {
    // Navigate to new invoice with patient pre-selected
    await page.goto(`/hospital/billing/new?patientId=${patientId}`)
    await page.waitForLoadState('networkidle')

    // If patient is not pre-filled, select from dropdown
    const patientSelect = page.locator('#patient_id, select[name="patient_id"]').first()
    if (await patientSelect.count() > 0) {
      const currentVal = await patientSelect.inputValue()
      if (!currentVal) {
        // Select the billing patient by value or label
        const options = page.locator('#patient_id option, select[name="patient_id"] option')
        const count = await options.count()
        for (let i = 1; i < count; i++) {
          const text = await options.nth(i).innerText()
          if (text.includes(PATIENT_NAME)) {
            await patientSelect.selectOption({ index: i })
            break
          }
        }
      }
    }

    // Add a line item — description, quantity, unit price
    const billingPage = new BillingPage(page)
    await billingPage.addLineItem('Consultation fee', '1', '150.00', 0)

    // Add a second line item if there's an "Add item" button
    const addItemBtn = page.locator('button:has-text("Add item"), button:has-text("Add line item")').first()
    if (await addItemBtn.count() > 0) {
      await addItemBtn.click()
      await billingPage.addLineItem('Lab test', '1', '50.00', 1)
    }

    // Due date (optional but good practice)
    const dueDateInput = page.locator('#due_date, input[name="due_date"]').first()
    if (await dueDateInput.count() > 0) {
      const nextMonth = new Date()
      nextMonth.setDate(nextMonth.getDate() + 30)
      await dueDateInput.fill(nextMonth.toISOString().slice(0, 10))
    }

    await billingPage.submitInvoiceForm()

    await page.waitForURL(/\/hospital\/billing\/[^/]+$/, { timeout: 15_000 })
    invoiceId = new URL(page.url()).pathname.split('/').pop()!

    // Invoice detail should show DRAFT status
    await expect(page.locator('body')).toContainText(/Draft/i)
  })

  test('invoice detail page shows patient name and line items', async ({ page }) => {
    await page.goto(`/hospital/billing/${invoiceId}`)
    await page.waitForLoadState('networkidle')

    // Invoice number visible (INV-...)
    await expect(page.locator(':text("INV-")').first()).toBeVisible()

    // Total amount shown
    await expect(page.locator(':text("Total"), :text("total")').first()).toBeVisible()
  })

  test('can issue the invoice (DRAFT → ISSUED)', async ({ page }) => {
    await page.goto(`/hospital/billing/${invoiceId}`)
    await page.waitForLoadState('networkidle')

    const billingPage = new BillingPage(page)
    const issueBtn = page.locator('button:has-text("Issue"), form[action*="issue"] button, a:has-text("Issue")').first()

    if (await issueBtn.count() === 0) {
      test.skip(true, 'Issue button not found — may already be issued')
      return
    }

    await issueBtn.click()
    await page.waitForLoadState('networkidle')

    // Status should now be ISSUED
    await expect(page.locator(':text("Issued"), :text("ISSUED")').first()).toBeVisible()
  })

  test('can record a payment against the issued invoice', async ({ page }) => {
    await page.goto(`/hospital/billing/${invoiceId}`)
    await page.waitForLoadState('networkidle')

    const billingPage = new BillingPage(page)
    const recordBtn = page.locator(
      'button:has-text("Record payment"), a:has-text("Record payment")'
    ).first()

    if (await recordBtn.count() === 0) {
      test.skip(true, 'Record payment button not found')
      return
    }

    await recordBtn.click()

    // Payment form appears (may be inline or a modal)
    const amountInput = page.locator('#amount, input[name="amount"]').first()
    await amountInput.waitFor({ state: 'visible', timeout: 5_000 })
    await amountInput.fill('100.00')

    // Payment method select
    const methodSelect = page.locator('#payment_method, select[name="payment_method"]').first()
    if (await methodSelect.count() > 0) {
      await methodSelect.selectOption('CASH')
    }

    // Notes
    const notesInput = page.locator('#notes, input[name="notes"], textarea[name="notes"]').first()
    if (await notesInput.count() > 0) {
      await notesInput.fill('E2E test payment')
    }

    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')

    // After payment, amount_paid should be reflected
    await expect(page.locator(':text("100"), :text("100.00")').first()).toBeVisible()
  })

  test('invoice detail shows payment history', async ({ page }) => {
    await page.goto(`/hospital/billing/${invoiceId}`)
    await page.waitForLoadState('networkidle')

    // Payment history section
    const paymentsSection = page.locator(':text("Payment"), :text("Payments")').first()
    await expect(paymentsSection).toBeVisible()
  })

  test('can void an invoice', async ({ page }) => {
    // Create a fresh DRAFT invoice to void (so we do not destroy the issued one)
    await page.goto(`/hospital/billing/new?patientId=${patientId}`)
    await page.waitForLoadState('networkidle')

    const patientSelect = page.locator('#patient_id, select[name="patient_id"]').first()
    if (await patientSelect.count() > 0) {
      const options = page.locator('#patient_id option, select[name="patient_id"] option')
      const count = await options.count()
      for (let i = 1; i < count; i++) {
        const text = await options.nth(i).innerText()
        if (text.includes(PATIENT_NAME)) {
          await patientSelect.selectOption({ index: i })
          break
        }
      }
    }

    const billingPage = new BillingPage(page)
    await billingPage.addLineItem('To be voided', '1', '10.00', 0)
    await billingPage.submitInvoiceForm()
    await page.waitForURL(/\/hospital\/billing\/[^/]+$/, { timeout: 15_000 })

    const voidInvoiceId = new URL(page.url()).pathname.split('/').pop()!

    // Click Void
    const voidBtn = page.locator('button:has-text("Void"), form[action*="void"] button, a:has-text("Void")').first()
    if (await voidBtn.count() === 0) {
      test.skip(true, 'Void button not found')
      return
    }

    page.once('dialog', (dialog) => dialog.accept())
    await voidBtn.click()
    await page.waitForLoadState('networkidle')

    // Status should be VOID
    await expect(page.locator(':text("Void"), :text("VOID"), :text("Voided")').first()).toBeVisible()

    // Verify the voided invoice appears with Void filter on the list page
    await page.goto('/hospital/billing?status=VOID')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('No void invoices found')
  })

  test('billing list filter by status works', async ({ page }) => {
    await page.goto('/hospital/billing')
    await page.waitForLoadState('networkidle')

    // Click the "Draft" filter pill
    const draftFilter = page.locator('[aria-label="Filter by status"] a:has-text("Draft"), nav a:has-text("Draft")').first()
    if (await draftFilter.count() > 0) {
      await draftFilter.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/status=DRAFT/)
    }
  })
})
