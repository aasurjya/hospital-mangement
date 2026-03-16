# Project Structure

## Purpose
This file is the first-stop structural map for AI agents and developers. Read this before scanning the full repository.

## Current State
Phase 4 — Internal Communication (Chat) is complete and building clean.

## What Is Built

### Phase 1 — Platform Foundation
- Next.js 16 app with TypeScript, Tailwind CSS, App Router
- Supabase local project (ports 54331–54334) with Postgres, Auth, Storage, Realtime
- Database migrations: extensions, roles, hospitals, user_profiles, audit_logs
- RLS policies on all tables (hospital_id scoping, platform admin cross-hospital)
- Seed: platform admin user seeded from `PLATFORM_ADMIN_EMAIL` env
- Supabase SSR auth client (browser + server + service-role)
- Next.js proxy (session refresh on every request)
- RBAC guards: `requireAuth`, `requirePlatformAdmin`, `requireHospitalAdmin`, `requireRoles`
- Audit logging utility: server-side only via service role
- Auth pages: `/login` with Zod-validated form
- Platform admin route: `/platform/hospitals` (guarded by `requirePlatformAdmin`)
- Unauthorized page: `/unauthorized`
- Dashboard redirect: `/dashboard` routes by role

### Phase 2 — Hospital Admin & Staff
- Hospital CRUD: `/platform/hospitals/new`, `/platform/hospitals/[id]/edit`
- Hospital detail: `/platform/hospitals/[id]`
- Hospital admin creation with one-time password: `/platform/hospitals/[id]/admins/new`
- Hospital admin dashboard: `/hospital/dashboard`
- Staff management: `/hospital/staff`, `/hospital/staff/new`
- One-time password: generated server-side, shown once in UI, never stored

### Phase 3 — Core Clinical Workflows
- Departments: `/hospital/departments`, `/hospital/departments/new`
- Patient registry: `/hospital/patients`, `/hospital/patients/new`, `/hospital/patients/[id]`
- Appointments: `/hospital/appointments`, `/hospital/appointments/new`
- Admissions: `/hospital/admissions`, `/hospital/admissions/new`
- Medical records: `/hospital/records`, `/hospital/records/new`, `/hospital/records/[id]`
- Status transitions: appointments (SCHEDULED→CONFIRMED→COMPLETED/NO_SHOW/CANCELLED), admissions (ADMITTED→DISCHARGED)
- Record finalization: DRAFT→FINALIZED with audit log

### Phase 4 — Internal Communication (Chat)
- Conversations: `/hospital/chat`, `/hospital/chat/[conversationId]`, `/hospital/chat/new`
- Direct messaging (one-on-one) with deduplication
- Group conversations (hospital-scoped, role-aware)
- Message threading with soft-delete and audit logging
- File attachments: Supabase Storage with signed URLs (1-hour expiry)
- Presence/status via Supabase Realtime
- All operations: hospital-scoped, role-scoped, tenant-isolated

## Actual Folder Structure
```text
hospital-management/
├── md/                          # Human-readable AI context
├── .claude/                     # AI guidance, knowledge base
├── supabase/
│   ├── config.toml              # Local ports: API=54331, DB=54332, Studio=54333
│   ├── seed.sql                 # Platform admin bootstrap
│   └── migrations/
│       ├── 20260314000001_extensions.sql
│       ├── 20260314000002_roles_and_hospitals.sql
│       ├── 20260314000003_user_profiles.sql
│       ├── 20260314000004_audit_logs.sql
│       ├── 20260314000005_departments.sql
│       ├── 20260314000006_patients.sql
│       ├── 20260314000007_appointments_admissions.sql
│       ├── 20260314000008_medical_records.sql
│       ├── 20260314000009_audit_events_phase3.sql
│       ├── 20260314000010_fix_rls_recursion.sql
│       ├── 20260314000011_conversation_type_enum.sql
│       ├── 20260314000012_conversations.sql
│       ├── 20260314000013_conversation_members.sql
│       ├── 20260314000014_messages.sql
│       ├── 20260314000015_message_attachments.sql
│       └── 20260314000016_chat_audit_events.sql
├── src/
│   ├── proxy.ts                 # Session refresh proxy (Next.js 16)
│   ├── types/
│   │   └── database.ts          # Supabase DB type map + all enums
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser client (Client Components)
│   │   │   └── server.ts        # Server client + service client
│   │   ├── rbac/
│   │   │   ├── roles.ts         # Role helpers (isPlatformAdmin, etc.)
│   │   │   └── guards.ts        # Server guards (requireAuth, etc.)
│   │   ├── audit/
│   │   │   └── log.ts           # writeAuditLog() server utility
│   │   ├── hospitals/
│   │   │   ├── password.ts      # generateTempPassword() one-time password util
│   │   │   └── schemas.ts       # Hospital + admin creation Zod schemas
│   │   ├── patients/
│   │   │   └── mrn.ts           # generateMrn() — MRN-{YEAR}-{8HEX}
│   │   └── chat/
│   │       ├── constants.ts     # CHAT_BUCKET, MAX_FILE_SIZE, ALLOWED_MIME_TYPES
│   │       └── schemas.ts       # Zod schemas for conversations, messages, attachments
│   ├── components/
│   │   └── chat/
│   │       ├── conversation-sidebar.tsx  # Conversation list with unread indicators
│   │       ├── message-thread.tsx  # Message list with soft-delete filtering
│   │       ├── message-bubble.tsx  # Individual message rendering
│   │       ├── message-input.tsx   # Text input + file uploader
│   │       └── new-conversation-form.tsx  # Form to create DIRECT or GROUP conversations
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx             # Root → /dashboard or /login
│       ├── dashboard/
│       │   └── page.tsx         # Role-based redirect
│       ├── (auth)/
│       │   └── login/
│       │       ├── page.tsx
│       │       ├── login-form.tsx
│       │       └── schema.ts
│       ├── platform/
│       │   ├── layout.tsx       # Guards all /platform/* (PLATFORM_ADMIN only)
│       │   └── hospitals/
│       │       ├── page.tsx     # Hospital list
│       │       ├── new/         # Create hospital
│       │       └── [id]/
│       │           ├── page.tsx # Hospital detail
│       │           ├── edit/    # Edit hospital
│       │           └── admins/new/  # Create hospital admin (one-time pw)
│       ├── hospital/
│       │   ├── layout.tsx       # Guards all /hospital/* (hospital staff)
│       │   ├── dashboard/
│       │   │   └── page.tsx
│       │   ├── departments/
│       │   │   ├── page.tsx     # List + toggle active
│       │   │   ├── new/         # Create department
│       │   │   ├── actions.ts
│       │   │   └── department-list.tsx  # Client Component
│       │   ├── staff/
│       │   │   ├── page.tsx     # Staff list
│       │   │   ├── new/         # Create staff (one-time pw)
│       │   │   └── actions.ts
│       │   ├── patients/
│       │   │   ├── page.tsx     # Patient list + search
│       │   │   ├── new/         # Register patient
│       │   │   ├── [id]/        # Patient detail (appointments/admissions/records summary)
│       │   │   └── actions.ts
│       │   ├── appointments/
│       │   │   ├── page.tsx     # Appointment list + status filter
│       │   │   ├── new/         # Book appointment
│       │   │   ├── actions.ts
│       │   │   └── appointment-rows.tsx  # Client Component (status transitions)
│       │   ├── admissions/
│       │   │   ├── page.tsx     # Admission list + status filter
│       │   │   ├── new/         # Admit patient
│       │   │   ├── actions.ts
│       │   │   └── admission-rows.tsx    # Client Component (discharge)
│       │   ├── records/
│       │   │   ├── page.tsx     # Medical records list
│       │   │   ├── new/         # Create medical record (DRAFT)
│       │   │   ├── [id]/        # Record detail + finalize
│       │   │   └── actions.ts
│       │   ├── rooms/
│       │   │   ├── page.tsx     # Room list + type/availability filters
│       │   │   ├── loading.tsx  # Skeleton
│       │   │   ├── room-table.tsx  # Client Component
│       │   │   ├── constants.ts    # ROOM_TYPES, PAGE_SIZE
│       │   │   ├── actions.ts      # bulkCreateRoomsAction, updateRoomAction, previewRoomsAction
│       │   │   ├── new/page.tsx    # 2-step bulk-add wizard
│       │   │   └── [id]/edit/      # Edit single room
│       │   └── chat/
│       │       ├── layout.tsx
│       │       ├── page.tsx     # Conversation list
│       │       ├── new/page.tsx # Create new conversation
│       │       ├── [conversationId]/page.tsx  # Conversation detail + message thread
│       │       ├── actions.ts   # Server actions (create/send/delete/add member)
│       │       └── __tests__/actions.test.ts
│       ├── unauthorized/
│       │   └── page.tsx
│       └── api/
│           └── auth/
│               └── logout/
│                   └── route.ts
├── .env.local                   # Local env (gitignored)
├── .env.local.example
└── package.json
```

## Local Development URLs
- App: http://localhost:3000
- Supabase Studio: http://127.0.0.1:54333
- Supabase API: http://127.0.0.1:54331
- Database: postgresql://postgres:postgres@127.0.0.1:54332/postgres
- Mailpit: http://127.0.0.1:54334

## Priority Build Order (Updated)
1. ~~Project bootstrap~~ ✅
2. ~~Auth and role system~~ ✅
3. ~~Multi-tenant hospital model and audit foundation~~ ✅
4. ~~Platform admin dashboard (hospitals CRUD, hospital admin creation)~~ ✅
5. ~~Hospital admin dashboard + staff management~~ ✅
6. ~~Core clinical workflows (departments, patients, appointments, admissions, records)~~ ✅
7. ~~Internal chat and document sharing~~ ✅
8. AI foundation and evaluation harness
9. AI pilot features
10. Automation and context refresh scripts

## Update Rule
Whenever folders are added, removed, or repurposed, update this file in the same task.
