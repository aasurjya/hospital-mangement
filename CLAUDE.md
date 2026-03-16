# Hospital Management Platform

> Multi-tenant hospital management SaaS built with Next.js and Supabase.
> Each hospital has its own staff, patients, departments, rooms, and clinical workflows.

## Project Status

### Completed
- **Phase 1**: Auth (email/password), RBAC (role-based access), audit logging, hospital CRUD
- **Phase 2**: Staff management, hospital admin creation, password resets (admin-initiated, one-time password)
- **Phase 3**: Patients (MRN generation), admissions (room assignment, discharge), appointments, medical records (DRAFT→FINALIZED), departments, rooms, real-time chat (direct, group, broadcast)
- **UX pass**: Mobile nav, loading skeletons, WCAG AA accessibility, 8dp grid alignment, confirmation dialogs on destructive actions
- **Phase 4**: Billing / invoicing (offline payments, invoice lifecycle DRAFT→ISSUED→PAID/PARTIAL/VOID, line items, payment recording)
- **Phase 5**: Room management UI (CRUD, occupancy indicators, floor filter, bulk availability toggle, OPERATIONS_MANAGER permissions)
- **Staff profile enhancement**: Professional fields (specialty, license, qualifications), employment fields (department, type, hire date), personal fields (address, emergency contact)
- **Phase 6**: Reporting dashboard (occupancy, financial, patients, appointments, staff workload, CSV export)
- **Phase 7**: Patient self-service portal (dashboard, appointments, admissions, records, billing, chat, profile, visit history, feedback, documents, patient nav)
- **Phase 8**: AI Clinical Assistant (SOAP notes, differential diagnosis, drug interactions, patient summary, audit trail, human-in-the-loop)
- **Phase 9**: Clinical Foundation (patient allergies with severity/reaction, diagnoses with ICD-10 codes, vital signs with trend tracking)
- **Phase 10**: Prescriptions & Medications (drug formulary, prescription lifecycle, drug-allergy safety check with override, medication orders: ordered→dispensed→administered)
- **Phase 11**: Lab Orders & Results (lab test catalogue, order lifecycle ORDERED→SAMPLE_COLLECTED→PROCESSING→COMPLETED, result entry with abnormal flagging)
- **Phase 12**: Discharge Summaries (auto-populated from diagnoses/prescriptions/vitals, DRAFT→FINALIZED lifecycle, linked to admissions)
- **Phase 13**: Email/SMS Notifications (notification templates with variable interpolation, notification log/queue, per-hospital event configuration)
- **Phase 14**: Staff Scheduling + OPD Queue (shift schedules with swap requests, outpatient queue with triage levels and sequential tokens)
- **Phase 15**: OR Scheduling + Inventory (operating room case management, inventory with stock tracking/alerts/transactions)
- **Phase 16**: Analytics (recharts trend charts) + Bed Board (real-time visual board, auto-populated beds per room)
- **Nav restructuring**: Dropdown groups (Clinical, Operations, Finance, Admin) for 20+ nav items

### Design Decisions (Permanent)
- No separate patient auth flow (patients use admin-created accounts, same login)
- No email-based password reset (admin-initiated verbal reset is the workflow)
- No self-service account creation (all accounts created by admins)
- ICD-10 codes stored as plain text (not FK to reference table)
- Drug-allergy check is soft-block with documented override reason
- Lab order numbers auto-generated: LAB-YYYY-XXXXXXXX
- Beds auto-populated (1 per room) on migration

---

## Stack
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Database | Supabase (PostgreSQL + Auth + RLS) — local dev via `npx supabase start` |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS (8dp grid, `text-gray-600` minimum for contrast) |
| Validation | Zod (server-side schema validation in all actions) |
| AI | Anthropic SDK (@anthropic-ai/sdk), Claude Sonnet 4.6 |
| Charts | Recharts (React charting library) |
| Testing | Jest |
| Package manager | npm |

---

## Project Structure
```
src/
├── app/
│   ├── (auth)/login/                        — Email/password login
│   ├── hospital/                            — Hospital staff routes (layout-guarded)
│   │   ├── layout.tsx                       — requireAuth() + HospitalNav + <main>
│   │   ├── dashboard/                       — Stats, quick actions (real data)
│   │   ├── patients/                        — Patient CRUD, search, detail view
│   │   │   ├── [id]/page.tsx                — Demographics, allergies, vitals, diagnoses, prescriptions, labs, records
│   │   │   ├── [id]/allergies/              — Allergy CRUD (DOCTOR, NURSE)
│   │   │   ├── [id]/diagnoses/              — Diagnosis CRUD (DOCTOR)
│   │   │   ├── [id]/vitals/                 — Vital signs recording + trend (DOCTOR, NURSE)
│   │   │   └── new/page.tsx                 — Create patient (MRN auto-generated)
│   │   ├── admissions/                      — Admit/discharge with room assignment
│   │   │   ├── new/                         — Patient search combobox, room/dept/doctor selectors
│   │   │   ├── [id]/discharge-summary/      — Discharge summary (auto-populated, DRAFT→FINALIZED)
│   │   │   └── admission-rows.tsx           — Discharge with confirmation dialog
│   │   ├── appointments/                    — Scheduling (status: SCHEDULED→COMPLETED)
│   │   ├── records/                         — Medical records (DRAFT→FINALIZED)
│   │   ├── billing/                         — Invoices + payments (offline)
│   │   │   ├── page.tsx                     — Invoice list, filters, search
│   │   │   ├── new/                         — Create invoice with line items
│   │   │   └── [id]/page.tsx               — Invoice detail, payments, actions
│   │   ├── staff/                           — Staff CRUD (Hospital Admin only)
│   │   │   ├── [id]/edit/                   — Edit profile, deactivate, reset password
│   │   │   └── new/                         — Create staff with temp password
│   │   ├── ai/                              — AI Clinical Assistant (DOCTOR only)
│   │   │   ├── page.tsx                     — Tab-based: SOAP Notes, Diagnosis, Drug Check, Patient Summary
│   │   │   ├── actions.ts                   — 4 AI generation server actions
│   │   │   ├── resolve-actions.ts           — Accept/Modify/Reject suggestions
│   │   │   └── suggestion-result.tsx        — Shared Accept/Modify/Reject UI component
│   │   ├── departments/                     — Department CRUD
│   │   ├── rooms/                           — Room CRUD, occupancy, bulk toggle
│   │   │   ├── page.tsx                     — Room list with type/availability/floor filters
│   │   │   ├── room-table.tsx               — Table with occupancy, checkboxes, bulk action bar
│   │   │   ├── new/page.tsx                 — Bulk room creation (2-step preview)
│   │   │   ├── [id]/edit/                   — Edit room details, toggle availability
│   │   │   ├── actions.ts                   — CRUD + bulkToggleAvailability actions
│   │   │   └── schemas.ts                   — Zod schemas (extracted for testability)
│   │   ├── reports/                         — Analytics dashboard with CSV export
│   │   │   ├── page.tsx                     — Tab-based reports (occupancy, financial, patients, appointments, staff)
│   │   │   ├── report-tabs.tsx              — Tab navigation + period selector
│   │   │   ├── stat-card.tsx                — KPI stat card component
│   │   │   └── queries/                     — Per-section data fetching (occupancy, financial, patients, appointments, staff)
│   │   ├── prescriptions/                   — Prescription lifecycle (DOCTOR prescribes, PHARMACIST dispenses, NURSE administers)
│   │   │   ├── page.tsx                     — Prescription list with status actions
│   │   │   ├── new/                         — Create prescription with drug-allergy check
│   │   │   └── [id]/page.tsx                — Detail + medication order actions
│   │   ├── formulary/                       — Drug catalogue CRUD (PHARMACIST, ADMIN)
│   │   ├── labs/                            — Lab orders + results
│   │   │   ├── page.tsx                     — Order list with status actions
│   │   │   ├── new/                         — Create lab order
│   │   │   ├── [id]/page.tsx                — Order detail + result entry
│   │   │   └── catalogue/                   — Lab test catalogue CRUD
│   │   ├── scheduling/                      — Staff shift schedules (weekly calendar)
│   │   ├── opd/                             — OPD queue board (triage, tokens, live status)
│   │   ├── or-schedule/                     — Operating room case scheduling
│   │   ├── inventory/                       — Stock management + alerts + transactions
│   │   ├── analytics/                       — Recharts trend charts (admissions, revenue, demographics, lab TAT)
│   │   ├── bed-board/                       — Real-time bed visualization by floor
│   │   ├── settings/notifications/          — Notification template management (ADMIN)
│   │   └── chat/                            — Real-time messaging (direct, group, broadcast)
│   │       ├── [conversationId]/page.tsx     — Message thread
│   │       └── new/page.tsx                 — Create conversation
│   ├── platform/                            — Platform admin routes
│   │   ├── layout.tsx                       — requirePlatformAdmin()
│   │   └── hospitals/                       — Hospital CRUD
│   │       ├── [id]/page.tsx                — Hospital detail (admins + staff tables)
│   │       ├── [id]/edit/                   — Edit hospital
│   │       ├── [id]/admins/                 — Hospital admin CRUD + password reset
│   │       └── [id]/staff/[staffId]/edit/   — Platform admin → edit any staff
│   ├── patient/                             — Patient self-service portal
│   │   ├── layout.tsx                       — requireAuth(PATIENT) + PatientNav
│   │   ├── dashboard/                       — Summary cards, reminder banner, quick actions
│   │   ├── appointments/                    — List, request new, cancel scheduled
│   │   ├── admissions/                      — Current + past, discharge instructions
│   │   ├── records/                         — Finalized only, print-friendly detail
│   │   ├── billing/                         — Invoices + payment history per invoice
│   │   ├── chat/                            — Conversations list + message thread
│   │   ├── profile/                         — Read-only medical info + editable contact
│   │   ├── history/                         — Unified visit timeline
│   │   ├── feedback/                        — 1-5 star ratings + comments
│   │   └── documents/                       — Upload/view/delete (Supabase Storage)
│   ├── api/auth/                            — Logout, callback endpoints
│   ├── api/reports/export/                  — CSV export endpoint
│   └── dashboard/                           — Role-based redirect (PATIENT → /patient/)
├── components/
│   ├── hospital-nav.tsx                     — Hospital staff nav with dropdown groups (Clinical, Operations, Finance, Admin)
│   ├── patient-nav.tsx                      — Patient portal nav (MyHealth brand)
│   └── chat/                                — Message thread, bubble, input, sidebar
├── lib/
│   ├── rbac/
│   │   ├── guards.ts                        — requireAuth(), requireHospitalAdmin(), requirePlatformAdmin()
│   │   ├── roles.ts                         — isHospitalStaff(), role helpers
│   │   └── constants.ts                     — STAFF_ROLES array
│   ├── supabase/
│   │   ├── server.ts                        — createSupabaseServerClient() (RLS), createSupabaseServiceClient() (admin)
│   │   └── client.ts                        — createSupabaseBrowserClient()
│   ├── audit/log.ts                         — writeAuditLog()
│   ├── hospitals/password.ts                — generateTempPassword()
│   ├── patients/mrn.ts                      — generateMrn() → "MRN-2026-A1B2C3D4"
│   ├── styles/
│   │   ├── variants.ts                      — Composite Tailwind class strings (btn, input, alert, statusBadge, table, card, nav)
│   │   └── index.ts                         — Barrel export
│   ├── billing/
│   │   ├── invoice-number.ts               — generateInvoiceNumber() → "INV-2026-A1B2C3D4"
│   │   └── permissions.ts                  — canWriteBilling(), canCreateBilling(), canViewBilling()
│   ├── rooms/
│   │   └── permissions.ts                  — canWriteRooms(), canViewRooms(), ROOM_MANAGEMENT_ROLES
│   ├── reports/
│   │   ├── permissions.ts                  — canViewReports(), REPORT_ACCESS_ROLES
│   │   ├── periods.ts                      — ReportPeriod presets, getDateRange()
│   │   ├── csv.ts                          — generateCsv() with formula injection prevention
│   │   └── types.ts                        — Report data type interfaces
│   ├── clinical/
│   │   ├── permissions.ts                  — canWriteAllergies(), canWriteDiagnoses(), canWriteVitals()
│   │   └── schemas.ts                      — Zod schemas for allergies, diagnoses, vitals
│   ├── prescriptions/
│   │   ├── permissions.ts                  — canPrescribe(), canDispense(), canAdminister(), canManageFormulary()
│   │   └── schemas.ts                      — Zod schemas for prescriptions, formulary
│   ├── labs/
│   │   ├── permissions.ts                  — canOrderLab(), canProcessLab(), canManageCatalogue()
│   │   ├── schemas.ts                      — Zod schemas for lab orders, results, catalogue
│   │   └── order-number.ts                 — generateLabOrderNumber() → "LAB-2026-XXXXXXXX"
│   ├── notifications/
│   │   └── permissions.ts                  — canManageNotifications() (HOSPITAL_ADMIN)
│   ├── scheduling/
│   │   └── permissions.ts                  — canManageSchedule() (HR_MANAGER, ADMIN)
│   ├── inventory/
│   │   └── permissions.ts                  — canManageInventory() (PHARMACIST, OPS_MANAGER, ADMIN)
│   ├── ai/
│   │   ├── client.ts                       — Anthropic SDK wrapper, graceful degradation
│   │   ├── config.ts                       — Model, rate limits, token caps
│   │   ├── permissions.ts                  — canUseAiAssistant() (DOCTOR only)
│   │   ├── rate-limit.ts                   — DB-based per-doctor hourly rate limiting
│   │   ├── schemas.ts                      — Zod schemas for AI inputs + resolution
│   │   └── prompts/                        — System prompt templates (SOAP, diagnosis, drug, summary)
│   ├── patient/
│   │   ├── permissions.ts                  — canCancelAppointment(), canSubmitFeedback(), isEditableContactField()
│   │   ├── schemas.ts                      — Patient portal Zod schemas (profile, appointment, feedback, document)
│   │   └── constants.ts                    — Document upload limits, allowed MIME types
│   ├── chat/                                — Chat constants, schemas
│   └── format.ts                            — formatLabel() → "HOSPITAL_ADMIN" → "Hospital Admin"
└── types/
    └── database.ts                          — All DB types, enums, row types (keep in sync with migrations)
```

---

## Role Hierarchy & Permissions

| Role | Scope | Can Manage |
|------|-------|------------|
| `PLATFORM_ADMIN` | All hospitals | Hospitals, hospital admins, any hospital staff |
| `HOSPITAL_ADMIN` | Own hospital | Staff (including other HAs), departments, patients |
| `DOCTOR` | Own hospital | Patients, records, appointments, prescriptions, lab orders, diagnoses, allergies, vitals, OR cases, AI assistant |
| `NURSE` | Own hospital | Patients, records, allergies, vitals, medication administration |
| `RECEPTIONIST` | Own hospital | Patients, appointments, OPD check-in |
| `PHARMACIST` | Own hospital | Drug formulary, medication dispensing, inventory |
| `LAB_TECHNICIAN` | Own hospital | Lab catalogue, lab orders processing, result entry |
| `HR_MANAGER` | Own hospital | Staff scheduling, shift management |
| `OPERATIONS_MANAGER` | Own hospital | Rooms, inventory |
| Other staff | Own hospital | Varies by role |
| `PATIENT` | Own records | Self-service portal: view appointments/admissions/records/billing, request/cancel appointments, submit feedback, upload documents, edit contact info, chat |

### Password Reset Scope
- Platform Admin → any hospital admin or staff (not other platform admins)
- Hospital Admin → any staff or other hospital admin in their hospital (not platform admins)
- Self-deactivation is blocked

---

## Database Schema (34 migrations)

### Core Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `hospitals` | Hospital entities | name, slug, is_active |
| `user_profiles` | All users (staff + admins) | hospital_id, role (enum), is_active, specialty, license_number, department_id, employment_type |
| `patients` | Patient records | hospital_id, mrn, full_name, user_id (FK auth.users, portal access), allergies, medical_notes |
| `departments` | Hospital departments | hospital_id, name, head_doctor_id |
| `rooms` | Hospital rooms/beds | hospital_id, room_number, room_type (enum), floor, is_available |
| `beds` | Individual beds within rooms | room_id, bed_number, is_available, current_patient_id, current_admission_id |

### Clinical Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `admissions` | Patient admissions | patient_id, doctor_id, department_id, room_id, bed_id, status (ADMITTED/DISCHARGED/TRANSFERRED) |
| `appointments` | Scheduled visits | patient_id, doctor_id, scheduled_at, status (SCHEDULED→COMPLETED) |
| `medical_records` | Clinical notes | patient_id, author_id, chief_complaint, status (DRAFT/FINALIZED) |
| `patient_allergies` | Allergy records | allergen_name, allergen_type, severity, reaction, status (ACTIVE/INACTIVE/RESOLVED) |
| `patient_diagnoses` | Diagnoses with ICD-10 | icd10_code, description, status (ACTIVE/RESOLVED/CHRONIC/RULED_OUT), diagnosed_date |
| `vital_signs` | Vital sign measurements | systolic_bp, diastolic_bp, heart_rate, temperature, o2_saturation, bmi (computed), pain_scale |
| `discharge_summaries` | Discharge documentation | admission_id (UNIQUE), diagnoses, medications snapshot, follow-up, status (DRAFT/FINALIZED) |

### Prescription & Medication Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `drug_formulary` | Hospital medication catalogue | generic_name, brand_name, form, strength, category |
| `prescriptions` | Patient prescriptions | drug_name, dosage, route, frequency, status (ACTIVE/COMPLETED/CANCELLED/DISCONTINUED), allergy_override |
| `medication_orders` | Dispense→administer lifecycle | prescription_id, status (ORDERED→DISPENSED→ADMINISTERED), dispensed_by, administered_by |

### Lab Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `lab_test_catalogue` | Hospital test menu | test_name, test_code, sample_type, normal_range, price |
| `lab_orders` | Lab test orders | order_number (auto), priority (ROUTINE/URGENT/STAT), status (ORDERED→COMPLETED) |
| `lab_results` | Test results | result_value, unit, normal_range, is_abnormal, interpretation, verified_by |

### Billing Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `invoices` | Invoice headers | hospital_id, patient_id, invoice_number, status (DRAFT/ISSUED/PAID/PARTIAL/VOID), total, amount_paid |
| `invoice_items` | Line items | invoice_id, description, quantity, unit_price, total |
| `payments` | Payment records | invoice_id, hospital_id, amount, method (CASH/CHECK/BANK_TRANSFER/MOBILE_MONEY/INSURANCE/OTHER) |

### Scheduling & Operations Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `shift_schedules` | Staff shift schedules | staff_id, shift_type (MORNING/AFTERNOON/NIGHT/ON_CALL), shift_date, start_time, end_time |
| `shift_swap_requests` | Shift swap requests | requester_shift_id, target_staff_id, status (PENDING/APPROVED/REJECTED) |
| `opd_queue` | Outpatient queue | token_number (daily sequential), triage_level, status (WAITING/IN_CONSULTATION/COMPLETED) |
| `or_cases` | Operating room scheduling | patient_id, room_id, primary_surgeon_id, procedure_name, anesthesia_type, status |

### Inventory Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `inventory_items` | Stock items | name, quantity_on_hand, reorder_level, cost_per_unit, expiry_date, drug_id |
| `inventory_transactions` | Stock movements | item_id, transaction_type (PURCHASE/DISPENSED/ADJUSTMENT/EXPIRED/RETURNED), quantity |
| `inventory_alerts` | Stock alerts | item_id, alert_type (LOW_STOCK/EXPIRED/EXPIRING_SOON), is_resolved |

### Notification Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `notification_templates` | Per-hospital templates | event_key, channel (EMAIL/SMS), body_template with {{variables}} |
| `notification_log` | Delivery log/queue | recipient, channel, status (PENDING/SENT/FAILED), related_entity |

### Chat Tables
| Table | Purpose |
|-------|---------|
| `conversations` | Chat threads (DIRECT, GROUP, BROADCAST) |
| `conversation_members` | Membership + last_read_at |
| `messages` | Message content |
| `message_attachments` | File attachments |

### System Tables
| Table | Purpose |
|-------|---------|
| `feedback` | Patient ratings (1-5) and comments on visits |
| `patient_documents` | Document uploads (insurance, ID, referrals) via Supabase Storage |
| `ai_suggestions` | AI clinical assistant audit trail (input, output, status, tokens) |
| `audit_logs` | All state changes (event_type enum, actor, subject, metadata) |

### Key Enums
- `app_role`: PLATFORM_ADMIN, HOSPITAL_ADMIN, DOCTOR, NURSE, RECEPTIONIST, LAB_TECHNICIAN, PHARMACIST, BILLING_STAFF, ACCOUNTANT, HR_MANAGER, OPERATIONS_MANAGER, PATIENT
- `admission_status`: ADMITTED, DISCHARGED, TRANSFERRED
- `appointment_status`: SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
- `record_status`: DRAFT, FINALIZED
- `room_type`: GENERAL, PRIVATE, SEMI_PRIVATE, ICU, NICU, EMERGENCY, OPERATION_THEATRE, ISOLATION
- `conversation_type`: DIRECT, GROUP, BROADCAST
- `invoice_status`: DRAFT, ISSUED, PAID, PARTIAL, VOID
- `payment_method`: CASH, CHECK, BANK_TRANSFER, MOBILE_MONEY, INSURANCE, OTHER
- `employment_type`: FULL_TIME, PART_TIME, CONTRACT, CONSULTANT
- `document_type`: INSURANCE_CARD, ID_DOCUMENT, REFERRAL_LETTER, OTHER
- `ai_suggestion_type`: SOAP_NOTE, DIFFERENTIAL_DIAGNOSIS, DRUG_INTERACTION, PATIENT_SUMMARY
- `ai_suggestion_status`: PENDING, ACCEPTED, MODIFIED, REJECTED
- `allergen_type`: DRUG, FOOD, ENVIRONMENTAL, OTHER
- `allergy_severity`: MILD, MODERATE, SEVERE, LIFE_THREATENING
- `allergy_status`: ACTIVE, INACTIVE, RESOLVED
- `diagnosis_status`: ACTIVE, RESOLVED, CHRONIC, RULED_OUT
- `drug_form`: TABLET, CAPSULE, LIQUID, INJECTION, TOPICAL, INHALER, DROPS, SUPPOSITORY, PATCH, OTHER
- `drug_category`: ANTIBIOTIC, ANALGESIC, ANTIHYPERTENSIVE, ... OTHER
- `prescription_status`: ACTIVE, COMPLETED, CANCELLED, DISCONTINUED
- `medication_order_status`: ORDERED, DISPENSED, ADMINISTERED, CANCELLED
- `medication_route`: ORAL, IV, IM, SC, TOPICAL, INHALATION, RECTAL, SUBLINGUAL, TRANSDERMAL, OTHER
- `lab_sample_type`: BLOOD, URINE, STOOL, CSF, SPUTUM, SWAB, TISSUE, OTHER
- `lab_order_priority`: ROUTINE, URGENT, STAT
- `lab_order_status`: ORDERED, SAMPLE_COLLECTED, PROCESSING, COMPLETED, CANCELLED
- `discharge_summary_status`: DRAFT, FINALIZED
- `notification_channel`: EMAIL, SMS
- `notification_status`: PENDING, SENT, FAILED
- `shift_type`: MORNING, AFTERNOON, NIGHT, ON_CALL
- `triage_level`: EMERGENCY, URGENT, SEMI_URGENT, NON_URGENT
- `opd_status`: WAITING, IN_CONSULTATION, COMPLETED
- `or_case_status`: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
- `anesthesia_type`: GENERAL, LOCAL, REGIONAL, SPINAL, EPIDURAL, SEDATION, NONE
- `inventory_transaction_type`: PURCHASE, DISPENSED, ADJUSTMENT, EXPIRED, RETURNED
- `inventory_alert_type`: LOW_STOCK, EXPIRED, EXPIRING_SOON

### RLS Policies
- All tables have RLS enabled
- Platform admins: full access via `is_platform_admin()` function
- Hospital staff: scoped to `my_hospital_id()` from JWT `app_metadata`
- Chat: members-only SELECT, admin-controlled INSERT

---

## Key Patterns

### Server Actions
Every mutation lives in an `actions.ts` file with `'use server'`. Pattern:
1. Call RBAC guard (`requireAuth()`, `requireHospitalAdmin()`, etc.)
2. Validate input with Zod schema
3. Execute DB operation with service client
4. Write audit log
5. Return typed state object or redirect

### Supabase Clients
- `createSupabaseServerClient()` — uses cookies, respects RLS. For reads in server components.
- `createSupabaseServiceClient()` — service role key, bypasses RLS. For admin writes in server actions.
- `createSupabaseBrowserClient()` — for client-side auth only (login form).

### UI Patterns
- Loading skeletons in `loading.tsx` files (animate-pulse)
- Confirmation dialogs (`window.confirm`) before destructive actions (discharge, deactivate, password reset)
- `formatLabel()` for all enum display (never show raw SCREAMING_SNAKE_CASE)
- Mobile hamburger nav (below md breakpoint)
- `role="status"` / `aria-live="polite"` on success banners
- `aria-label` on tables and comboboxes
- 44px minimum touch targets on interactive elements
- `text-gray-600` minimum for body text contrast (WCAG AA)
- Filter state preserved in pagination URLs

### File Organization
- One `actions.ts` per feature (server actions + state types)
- One `page.tsx` per route (server component)
- Client components in separate files (e.g., `edit-staff-form.tsx`, `admission-rows.tsx`)
- Shared constants in `src/lib/` (never export non-function values from `'use server'` files)

---

## Commands
```bash
npm run dev                # Dev server on localhost:3000
npx tsc --noEmit           # Type check (must pass with 0 errors)
npx jest                   # Run tests
npx supabase start         # Start local Supabase
npx supabase db reset      # Reset local DB with all migrations
npx supabase db push --local  # Push pending migrations to local DB
```

---

## Conventions
- Files: < 400 lines preferred, 800 max
- Functions: < 50 lines
- Immutable data: never mutate, return new objects
- No hardcoded secrets — environment variables only
- Validate at system boundaries (user input, API responses)
- Error handling: explicit at every level, user-friendly messages in UI, detailed logs server-side
- Commit format: `<type>: <description>` (feat, fix, refactor, docs, test, chore)
- No `'use server'` exports of non-function values (causes Next.js runtime errors)
- Use semantic color tokens (`primary`, `error`, `success`, `warning`, `caution`, `neutral`, `secondary`) not raw scales (`blue`, `red`, `green`, `gray`, `amber`, `yellow`, `indigo`). Defined in `globals.css` via `@theme inline`.
- Composite class strings available in `src/lib/styles/variants.ts` — import from `@/lib/styles` for buttons, inputs, alerts, badges, tables, cards, nav.

---

## Environment Variables
Required in `.env.local` (see `.env.local.example`):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-side only)
- `PLATFORM_ADMIN_EMAIL` — Bootstrap platform admin email
- `ANTHROPIC_API_KEY` — Anthropic API key (optional — AI features disabled without it)
