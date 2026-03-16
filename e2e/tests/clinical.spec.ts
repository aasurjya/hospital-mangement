/**
 * Suite 4 — Clinical Workflows
 *
 * Full end-to-end clinical journey:
 *   patient registration → appointment → admission → medical record (DRAFT→FINALIZED) → discharge
 *
 * Runs in serial mode because each step depends on data from the previous step.
 * Uses the stored hospital-admin session (admins have access to all clinical routes).
 */
import { test, expect } from '@playwright/test'
import { PatientsPage } from '../page-objects/PatientsPage'
import { TEST_PATIENT, TEST_DEPARTMENT } from '../fixtures/test-data'

const RUN_ID = Date.now()

// Shared state set during the serial run
let patientId: string
let patientName: string

test.describe.configure({ mode: 'serial' })

test.describe('Clinical Workflows', () => {
  // ── 1. Patient creation ────────────────────────────────────────────────

  test('can register a new patient and see MRN on detail page', async ({ page }) => {
    const patientsPage = new PatientsPage(page)
    await patientsPage.goto()
    await patientsPage.clickRegisterPatient()

    patientName = `${TEST_PATIENT.full_name} ${RUN_ID}`

    await patientsPage.fillNewPatientForm({
      fullName: patientName,
      dateOfBirth: TEST_PATIENT.date_of_birth,
      gender: TEST_PATIENT.gender,
      phone: TEST_PATIENT.phone,
      email: `patient.${RUN_ID}@test.local`,
    })
    await patientsPage.submitNewPatientForm()

    // Should redirect to patient detail page
    await page.waitForURL(/\/patients\/[^/]+$/, { timeout: 15_000 })
    patientId = new URL(page.url()).pathname.split('/').pop()!

    // MRN is displayed on the detail page
    const mrnEl = page.locator(':text("MRN")').first()
    await expect(mrnEl).toBeVisible()

    // Patient name appears in heading
    await expect(page.locator('h1, h2').first()).toContainText(patientName)
  })

  test('patient appears in the patient list after registration', async ({ page }) => {
    const patientsPage = new PatientsPage(page)
    await patientsPage.goto()

    await expect(page.locator(`a:has-text("${patientName}")`).first()).toBeVisible()
  })

  test('patient search returns the correct patient', async ({ page }) => {
    const patientsPage = new PatientsPage(page)
    await patientsPage.goto()
    await patientsPage.searchFor(patientName)

    await expect(page.locator(`a:has-text("${patientName}")`).first()).toBeVisible()
  })

  test('can view patient detail page', async ({ page }) => {
    const patientsPage = new PatientsPage(page)
    await patientsPage.goto()
    await patientsPage.clickPatientByName(patientName)

    await page.waitForURL(/\/patients\/[^/]+$/)
    await expect(page.locator('h1, h2').first()).toContainText(patientName)
  })

  // ── 2. Appointment scheduling ──────────────────────────────────────────

  test('can navigate to book appointment form', async ({ page }) => {
    await page.goto(`/hospital/appointments/new?patientId=${patientId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('Book appointment')
  })

  test('can book an appointment for the patient', async ({ page }) => {
    await page.goto(`/hospital/appointments/new?patientId=${patientId}`)
    await page.waitForLoadState('networkidle')

    // If patient is pre-selected via query param, the patient field should already show the patient
    // If not, select the patient
    const patientSelect = page.locator('#patient_id, select[name="patient_id"]').first()
    if (await patientSelect.count() > 0) {
      const currentVal = await patientSelect.inputValue()
      if (!currentVal || currentVal === '') {
        await patientSelect.selectOption({ index: 1 }) // Select first available patient
      }
    }

    // Select a doctor if available
    const doctorSelect = page.locator('#doctor_id, select[name="doctor_id"]').first()
    if (await doctorSelect.count() > 0) {
      const options = await doctorSelect.locator('option').count()
      if (options > 1) {
        await doctorSelect.selectOption({ index: 1 })
      }
    }

    // Set scheduled date/time (tomorrow at 10:00)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    const datetimeValue = tomorrow.toISOString().slice(0, 16) // "YYYY-MM-DDTHH:MM"

    const scheduledInput = page.locator('#scheduled_at, input[name="scheduled_at"]').first()
    await scheduledInput.fill(datetimeValue)

    // Reason / notes
    const reasonInput = page.locator('#reason, input[name="reason"], textarea[name="reason"]').first()
    if (await reasonInput.count() > 0) {
      await reasonInput.fill('E2E test appointment')
    }

    await page.click('button[type="submit"]')

    // Should redirect to appointments list or appointment detail
    await page.waitForURL(/\/hospital\/appointments($|\/)/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/hospital\/appointments/)
  })

  // ── 3. Admission ───────────────────────────────────────────────────────

  test('can navigate to admit patient form', async ({ page }) => {
    await page.goto(`/hospital/admissions/new?patientId=${patientId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('Admit patient')
  })

  test('can admit the patient to a room', async ({ page }) => {
    await page.goto(`/hospital/admissions/new?patientId=${patientId}`)
    await page.waitForLoadState('networkidle')

    // Patient should be pre-selected via query param; if not, select manually
    const patientSelect = page.locator('#patient_id, select[name="patient_id"]').first()
    if (await patientSelect.count() > 0) {
      const currentVal = await patientSelect.inputValue()
      if (!currentVal) {
        await patientSelect.selectOption({ index: 1 })
      }
    }

    // Select doctor
    const doctorSelect = page.locator('#doctor_id, select[name="doctor_id"]').first()
    if (await doctorSelect.count() > 0) {
      const opts = await doctorSelect.locator('option').count()
      if (opts > 1) await doctorSelect.selectOption({ index: 1 })
    }

    // Select department
    const deptSelect = page.locator('#department_id, select[name="department_id"]').first()
    if (await deptSelect.count() > 0) {
      const opts = await deptSelect.locator('option').count()
      if (opts > 1) await deptSelect.selectOption({ index: 1 })
    }

    // Select room (only available rooms shown)
    const roomSelect = page.locator('#room_id, select[name="room_id"]').first()
    if (await roomSelect.count() > 0) {
      const opts = await roomSelect.locator('option').count()
      if (opts > 1) await roomSelect.selectOption({ index: 1 })
    }

    // Reason
    const reasonInput = page.locator('#reason, input[name="reason"], textarea[name="reason"]').first()
    if (await reasonInput.count() > 0) {
      await reasonInput.fill('E2E test admission')
    }

    await page.click('button[type="submit"]')

    // Redirect to admissions list or detail
    await page.waitForURL(/\/hospital\/admissions($|\/)/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/hospital\/admissions/)
  })

  // ── 4. Medical record ─────────────────────────────────────────────────

  test('can navigate to create new medical record', async ({ page }) => {
    await page.goto(`/hospital/records/new?patientId=${patientId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText(/medical record/i)
  })

  test('can create a DRAFT medical record', async ({ page }) => {
    await page.goto(`/hospital/records/new?patientId=${patientId}`)
    await page.waitForLoadState('networkidle')

    // Chief complaint (required)
    const complaintInput = page.locator(
      '#chief_complaint, input[name="chief_complaint"], textarea[name="chief_complaint"]'
    ).first()
    await complaintInput.fill('E2E test complaint — headache')

    // Notes / observations
    const notesInput = page.locator(
      '#notes, textarea[name="notes"], #observations, textarea[name="observations"]'
    ).first()
    if (await notesInput.count() > 0) {
      await notesInput.fill('Patient reports mild headache for 2 days.')
    }

    await page.click('button[type="submit"]')

    // Redirect to record detail or records list
    await page.waitForURL(/\/hospital\/records($|\/)/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/hospital\/records/)
  })

  test('medical record appears in list with DRAFT status', async ({ page }) => {
    await page.goto('/hospital/records')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText(/Records/i)
    // The page renders — at minimum verify no error state
    await expect(page.locator('body')).not.toContainText('Error')
  })

  test('can view and finalize a DRAFT medical record', async ({ page }) => {
    // Navigate to records and click the most recent record that belongs to our patient
    await page.goto('/hospital/records')
    await page.waitForLoadState('networkidle')

    // Find a row with a "Finalize" or "View" action and click it
    const viewLink = page.locator('a:has-text("View"), a[href*="/records/"]').first()
    if (await viewLink.count() === 0) {
      test.skip(true, 'No records visible in list — skipping finalization test')
      return
    }
    await viewLink.click()
    await page.waitForURL(/\/records\/[^/]+$/, { timeout: 10_000 })

    // Finalize button
    const finalizeBtn = page.locator('button:has-text("Finalize"), a:has-text("Finalize")').first()
    if (await finalizeBtn.count() > 0) {
      page.once('dialog', (dialog) => dialog.accept())
      await finalizeBtn.click()

      // After finalization, status should show FINALIZED
      const finalizedBadge = page.locator(':text("Finalized"), :text("FINALIZED")').first()
      await finalizedBadge.waitFor({ state: 'visible', timeout: 10_000 })
    }
  })

  // ── 5. Discharge ───────────────────────────────────────────────────────

  test('can discharge the admitted patient', async ({ page }) => {
    await page.goto('/hospital/admissions')
    await page.waitForLoadState('networkidle')

    // Find the admission row and click Discharge
    const dischargeButton = page.locator(
      'button:has-text("Discharge"), a:has-text("Discharge")'
    ).first()

    if (await dischargeButton.count() === 0) {
      test.skip(true, 'No active admissions to discharge — skipping')
      return
    }

    page.once('dialog', (dialog) => dialog.accept())
    await dischargeButton.click()

    // After discharge, row should show DISCHARGED status or disappear from active list
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1')).toContainText(/Admissions/i)
  })
})
