# Completed Work Log

## Status: Phases 1–4 Complete ✅

---

## Phase 1 — Platform Foundation ✅

- Next.js 16 + TypeScript + Tailwind CSS + App Router
- Supabase local (ports 54331–54334), custom project separate from other projects
- Email/password auth with `enable_signup = false` (admin-provisioned only)
- Platform admin bootstrapped from `PLATFORM_ADMIN_EMAIL` env + seed.sql
- `app_role` enum (12 roles), `hospitals`, `user_profiles`, `audit_logs` tables
- RLS on all tables — hospital_id scoping, JWT-based to avoid recursion
- RBAC guards: `requireAuth`, `requirePlatformAdmin`, `requireHospitalAdmin`, `requireRoles`
- Audit logging via service role (never surfaced to users)
- Next.js 16 `proxy.ts` (session refresh on every request)
- `/login`, `/unauthorized`, `/dashboard` (role-based redirect)

**Bug fixes applied:**
- `aud` field missing from direct `auth.users` insert → added to seed
- `confirmation_token` and token columns NULL → set to empty strings in seed
- `user_profiles` insert blocked by RLS in seed → `set local role postgres`
- Infinite RLS recursion on `user_profiles` (helper functions calling same table) → rewrote policies to use `auth.jwt() -> 'app_metadata'` and added sync trigger

---

## Phase 2 — Hospital Admin & Staff ✅

- Hospital CRUD: create, edit, activate/deactivate
- Hospital detail page with admin list
- Hospital admin creation with one-time password (shown once, never stored)
- Hospital admin dashboard with staff count
- Staff management: list, create with one-time password, all clinical roles
- `app_metadata` synced to JWT on user creation (role + hospital_id)

**Verified working:**
- Platform admin `corp.asurjya@gmail.com` login → `/platform/hospitals`
- Hospital added via platform admin
- Hospital admin created and can log in → `/hospital/dashboard`
- Staff member visible in count (1)

---

## Phase 3 — Core Clinical Workflows ✅

- **Departments**: list with toggle active, create
- **Patients**: register, list + search, detail page with summaries
- **Appointments**: book, list with status filter, status transitions (SCHEDULED→CONFIRMED→COMPLETED/NO_SHOW/CANCELLED)
- **Admissions**: admit patient, list with status filter, discharge action
- **Medical Records**: create as DRAFT, list, detail page, finalize (DRAFT→FINALIZED)
- All list pages paginated (25/page)
- All forms pre-fill patient when navigated from patient detail
- Audit logged: patient created, appointment created/updated, admission created/discharged, record created/finalized

---

## Phase 4 — Internal Communication (Chat) ✅

- **Conversations**: DIRECT (one-on-one with deduplication) and GROUP (hospital-scoped, role-scoped)
- **Messaging**: text + optional attachments, soft-delete with audit logging
- **File Attachments**: Supabase Storage with signed URLs (1-hour expiry), MIME type + size validation
- **Presence/Status**: Supabase Realtime for real-time indicators
- **Components**: conversation sidebar, message thread, message bubbles, new conversation form, message input with file uploader
- **Database**: 6 migrations (000011–000016) — conversation_type enum, conversations, conversation_members, messages, message_attachments, audit events
- All operations: hospital-scoped, role-scoped, tenant-isolated

**Verified working:**
- Hospital admin creates DIRECT conversation with staff member
- Staff member receives message in real-time (Realtime subscription)
- File attachment upload validated server-side (MIME type + size + path traversal prevention)
- Message soft-delete with audit logging
- Admin can add members to GROUP conversations (authorization enforced)

**Critical Security Fixes Applied (5 total):**
1. `deleteMessageAction` — Hospital isolation check enforced before role check (line 344–349)
2. `addMemberAction` — Conversation hospital_id verified before member insert (line 415–427)
3. `removeMemberAction` — Conversation hospital_id verified before deletion (line 481–492)
4. `getAttachmentUrlAction` — Authentication required; storage path must start with caller's hospital_id (line 526–542)
5. `sendMessageAction` — Attachment payloads re-validated server-side (MIME, size, path); hospital prefix enforced (line 174–201)

**RLS Policy Hardening:**
- All conversation/message/attachment tables use JWT `auth.metadata` instead of helper function calls (prevents recursion)
- Hospital isolation enforced at both RLS layer and application logic
- Soft-delete queries filter out `deleted_at IS NOT NULL`

---

## Next: Phase 5 — Clinical Data Enrichment

Per roadmap (`md/pre-build-roadmap.md`):
- Vitals (BP, HR, O2, temperature)
- Allergies with severity/reaction tracking
- Medications with dosage + frequency
- Lab orders and results
- Encounter timeline (appointments → admissions → discharge → records)

Then Phase 6: AI Foundation
