# Pre-Build Roadmap

## Purpose
Define what should be improved and frozen before writing the main application code.

## Core Principle
Do not start with the AI feature first.

Build the platform in this order:
- security first
- identity and roles second
- core hospital workflows third
- communication fourth
- AI assistance fifth

## Decisions To Freeze Before Coding

### 1. Platform Scope
- Multi-tenant platform with `hospitalId` scoping
- Platform admin has cross-hospital visibility and control
- Hospital admin manages one hospital only

### 2. Infrastructure Preference
Use a Supabase-first backend strategy:
- Supabase Auth for email/password users
- Supabase Postgres as the primary database
- Supabase Storage for documents and attachments
- Supabase Realtime for chat and presence where possible
- Supabase migrations and functions as the source of truth for database behavior and RLS

### 3. AI Positioning
- AI is clinician-assistive only
- No autonomous diagnosis in v1
- No public patient self-diagnosis feature in v1

### 4. Data Governance
- Audit logs are mandatory
- Role changes and password resets are audited
- AI interactions are audited
- File access is permission-scoped

### 5. Standards Direction
- Keep the data model compatible with future FHIR mapping
- Keep the decision-support layer open for future CDS Hooks style integration

## Recommended Target Architecture
```text
hospital-management/
├── md/
│   ├── structure.md
│   ├── ai-context.md
│   ├── automation.md
│   ├── ai-clinical-assistant.md
│   └── pre-build-roadmap.md
├── .claude/
├── .windsurf/
├── app/
│   ├── (auth)/
│   ├── (platform)/
│   ├── (hospital)/
│   ├── (doctor)/
│   ├── (staff)/
│   └── api/
│       ├── auth/
│       ├── admin/
│       ├── chat/
│       ├── uploads/
│       └── ai/
├── components/
├── lib/
│   ├── auth/
│   ├── rbac/
│   ├── db/
│   ├── audit/
│   ├── validation/
│   ├── chat/
│   └── ai/
├── supabase/
│   ├── migrations/
│   ├── functions/
│   ├── seed.sql
│   └── config.toml
├── evals/
│   └── clinical/
├── public/
├── scripts/
└── types/
```

## Recommended Phases

### Phase 0: Architecture and Governance
Deliverables:
- final folder structure
- auth approach
- role matrix
- audit strategy
- AI safety strategy
- document and retention policy decisions

### Phase 1: Platform Foundation
Deliverables:
- Next.js app bootstrap
- Supabase local setup
- email/password auth
- platform admin bootstrap from env
- hospital and user profile tables
- RBAC middleware and server guards
- audit log base tables

### Phase 2: Core Hospital Operations
Deliverables:
- hospitals
- departments
- staff directory
- patient registry
- appointments
- admissions
- medical record shell

### Phase 3: Internal Communication
Deliverables:
- conversations
- messages
- attachments
- presence/status
- role- and hospital-scoped access checks

### Phase 4: Clinical Data Enrichment
Deliverables:
- vitals
- allergies
- medications
- lab orders/results
- diagnosis/problem list
- encounter timeline

### Phase 5: AI Foundation
Deliverables:
- AI provider abstraction
- prompt registry
- output schemas
- rule engine for red flags
- approved knowledge retrieval layer
- evaluation harness
- AI audit logs

### Phase 6: AI Pilot Features
Deliverables:
- note drafting
- encounter summarization
- red-flag detection
- follow-up question suggestions
- low-risk doctor-only assistance

### Phase 7: Advanced Clinical Assistance
Deliverables:
- differential-diagnosis assistance
- test suggestion support
- medication contradiction reminders
- role-targeted explainability UX

### Phase 8: Interoperability and Hardening
Deliverables:
- FHIR mapping plan
- external integration adapters
- performance tuning
- observability
- security review
- AI eval regression pipeline

## Non-Functional Requirements
- hospital isolation by default
- least-privilege access
- strong auditability
- usable without AI
- graceful failure when external AI is unavailable
- pagination on list views
- document upload controls
- explainable clinical suggestions

## Open Decisions Still Needed
- exact regulatory/compliance target geography
- retention policy for chat and attachments
- approved medical knowledge sources for AI retrieval
- whether patients can message clinicians directly in v1
- whether some roles require stricter session policies than others

## Build Priority Recommendation
Start coding only after:
- auth strategy is finalized
- role matrix is finalized
- database source of truth is finalized
- AI scope is constrained and documented
- audit logging is part of the first schema, not an afterthought
