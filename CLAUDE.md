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

### Design Decisions (Permanent)
- No separate patient auth flow (patients use admin-created accounts, same login)
- No email-based password reset (admin-initiated verbal reset is the workflow)
- No self-service account creation (all accounts created by admins)
- Email notifications — deferred, not currently planned

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
│   │   │   ├── [id]/page.tsx                — Demographics, appointments, admissions, records
│   │   │   └── new/page.tsx                 — Create patient (MRN auto-generated)
│   │   ├── admissions/                      — Admit/discharge with room assignment
│   │   │   ├── new/                         — Patient search combobox, room/dept/doctor selectors
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
│   ├── hospital-nav.tsx                     — Hospital staff desktop + mobile nav
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
| `DOCTOR` | Own hospital | Patients, records, appointments |
| `NURSE` | Own hospital | Patients, records |
| `RECEPTIONIST` | Own hospital | Patients, appointments |
| Other staff | Own hospital | Varies by role |
| `PATIENT` | Own records | Self-service portal: view appointments/admissions/records/billing, request/cancel appointments, submit feedback, upload documents, edit contact info, chat |

### Password Reset Scope
- Platform Admin → any hospital admin or staff (not other platform admins)
- Hospital Admin → any staff or other hospital admin in their hospital (not platform admins)
- Self-deactivation is blocked

---

## Database Schema (25 migrations)

### Core Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `hospitals` | Hospital entities | name, slug, is_active |
| `user_profiles` | All users (staff + admins) | hospital_id, role (enum), is_active, specialty, license_number, department_id, employment_type |
| `patients` | Patient records | hospital_id, mrn, full_name, user_id (FK auth.users, portal access), allergies, medical_notes |
| `departments` | Hospital departments | hospital_id, name, head_doctor_id |
| `rooms` | Hospital rooms/beds | hospital_id, room_number, room_type (enum), floor, is_available |

### Clinical Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `admissions` | Patient admissions | patient_id, doctor_id, department_id, room_id, status (ADMITTED/DISCHARGED/TRANSFERRED) |
| `appointments` | Scheduled visits | patient_id, doctor_id, scheduled_at, status (SCHEDULED→COMPLETED) |
| `medical_records` | Clinical notes | patient_id, author_id, chief_complaint, status (DRAFT/FINALIZED) |

### Billing Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `invoices` | Invoice headers | hospital_id, patient_id, invoice_number, status (DRAFT/ISSUED/PAID/PARTIAL/VOID), total, amount_paid |
| `invoice_items` | Line items | invoice_id, description, quantity, unit_price, total |
| `payments` | Payment records | invoice_id, hospital_id, amount, method (CASH/CHECK/BANK_TRANSFER/MOBILE_MONEY/INSURANCE/OTHER) |

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
