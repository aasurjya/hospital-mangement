# AI Context

## Product Summary
This project is a multi-tenant hospital management platform built for the web with Next.js and Supabase.
It is planned to include a doctor-facing AI Clinical Assistant for safe, clinician-supervised support.

## Core Business Model
- Platform admin is the top-level owner of the full platform.
- Platform admin can create and manage hospitals.
- Platform admin can create hospital admins.
- Hospital admin manages all operations inside a single hospital.
- Hospital admin can create users for hospital staff roles.
- Users log in with email and password.
- Hospital admin can change and renew staff passwords.
- Platform admin can see all hospitals and all hospital data.
- Internal users can send socket-based text messages and documents to each other for office work.

## Confirmed Tech Decisions
- Frontend framework: Next.js
- Language: TypeScript
- Database: Supabase Postgres, starting locally
- Architecture: multi-tenant
- Realtime chat: socket-based
- Authentication: email and password
- Platform admin email from env: `corp.asurjya@gmail.com`
- AI positioning: clinician-assistive only
- AI safety model: deterministic red-flag rules plus retrieval-guided LLM assistance

## Recommended Roles
- `PLATFORM_ADMIN`
- `HOSPITAL_ADMIN`
- `DOCTOR`
- `NURSE`
- `RECEPTIONIST`
- `LAB_TECHNICIAN`
- `PHARMACIST`
- `BILLING_STAFF`
- `ACCOUNTANT`
- `HR_MANAGER`
- `OPERATIONS_MANAGER`
- `PATIENT`

## High-Level Data Domains
- Hospitals
- Users
- User profiles
- Roles and permissions
- Departments
- Appointments
- Admissions
- Medical records
- Lab orders and results
- Prescriptions
- Billing and payments
- Chat conversations
- Chat messages
- File attachments
- Audit logs
- AI interaction logs
- Prompt and model versions
- Clinical knowledge sources
- Evaluation datasets

## AI Clinical Assistant Scope
- Doctor-facing symptom summarization
- Red-flag detection
- Suggested follow-up questions
- Differential-diagnosis brainstorming for clinician review
- Suggested tests or labs to consider
- Clinical note drafting
- Lab-result contextual summaries

## AI Clinical Assistant Non-Goals
- No autonomous diagnosis
- No autonomous prescription generation
- No autonomous emergency triage decision
- No patient-facing self-diagnosis product in v1
- No silent writes into the medical record

## Key Architectural Rules
- All business data except platform-level control should be scoped by `hospitalId`.
- Platform admin has cross-tenant visibility.
- Hospital admins only manage their own hospital.
- Passwords must never be stored in plain text.
- If the UI needs to show a created password once, it should be generated, hashed for storage, and only shown once at creation/reset time.
- Chat attachments should be stored outside the primary relational tables and referenced by metadata.
- Audit logs should exist for user creation, password reset, and role changes.
- AI outputs must be assistive only and always require human review.
- AI requests must run server-side only.
- Deterministic rules should handle emergency red flags and non-negotiable safety checks.
- AI outputs should show evidence, uncertainty, and missing information where possible.
- AI interactions should capture model version, prompt version, inputs, outputs, and clinician accept/edit/reject outcomes.
- The platform should remain usable when AI is disabled or unavailable.
- Design should stay open to future FHIR mapping and CDS Hooks style integrations.

## Environment Inputs
- `PLATFORM_ADMIN_EMAIL=corp.asurjya@gmail.com`
- Supabase local development configuration
- Auth secret and database URLs will be needed during implementation

## Open Questions
- Message retention policy is not finalized yet.
- Exact patient-facing permissions are not finalized yet.
- Whether patients can directly message staff or only specific roles is not finalized yet.
- Exact file size and file type limits for chat documents are not finalized yet.
- Exact compliance and regulatory target geography is not finalized yet.
- Approved medical knowledge sources for AI retrieval are not finalized yet.
- Whether external AI APIs can be used with production PHI is not finalized yet.
- Whether patients should receive any AI-generated output in later phases is not finalized yet.

## AI Working Rule
Before searching the full codebase, read:
1. `md/ai-context.md`
2. `md/structure.md`
3. `md/automation.md`
4. `md/ai-clinical-assistant.md`
5. `md/pre-build-roadmap.md`
Then inspect only the folders related to the task.
