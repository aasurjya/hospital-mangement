# Project Context

## Summary
Multi-tenant hospital management platform built with Next.js 16 and Supabase. Supports platform-level administration (managing multiple hospitals) and hospital-level operations (patients, admissions, staff, appointments, records, chat).

## Current State
- Phase 1 complete: Auth, RBAC, audit logs, hospital CRUD
- Phase 2 complete: Staff management, hospital admin creation, password resets
- Phase 3 complete: Patients, admissions, appointments, medical records, departments, rooms, real-time chat
- UX pass complete: Mobile nav, loading skeletons, accessibility (WCAG AA), grid alignment, confirmation dialogs

## Primary Product Rules
- Platform admin controls the full platform
- Hospital admin controls one hospital
- Internal users communicate with socket-based chat
- Email/password auth required
- Platform admin email comes from env
- AI is clinician-assistive only (planned)
- All state changes are audit-logged

## Context Loading
The root `CLAUDE.md` is automatically loaded by Claude Code at conversation start. It contains the full project structure, stack, patterns, and conventions. Read that first — no need to scan the entire codebase.

## Files To Check First
- `CLAUDE.md` (root) — project overview, patterns, commands
- `src/types/database.ts` — all DB types and enums
- `src/lib/rbac/guards.ts` — auth guards
- `supabase/migrations/` — DB schema

## Notes
Keep `CLAUDE.md` and this file aligned whenever architecture changes.
