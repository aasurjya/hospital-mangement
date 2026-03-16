# Build Validation Guide — Next.js

This guide covers the validation workflow for the hospital management web platform.

---

## Validation Order

Always validate in this order:

1. `npm run lint`
2. `npm run test`
3. `npm run build`
4. `supabase migration list` if database work changed

If any step fails, stop and fix before proceeding.

---

## During Development

Use fast checks while iterating:

```bash
npm run lint
npm run test -- --runInBand
```

---

## Before Marking Work Complete

```bash
npm run lint
npm run test
npm run build
```

For database changes:

```bash
supabase migration list
```

---

## Upload and Realtime Validation

If the task touches file sharing or chat, also verify:

- file size limits
- file type restrictions
- room membership checks
- hospital scoping
- reconnect and disconnect behavior

---

## Build Error Resolution

### Process

1. Identify all current errors
2. Group them by root cause
3. Fix root causes first
4. Re-run the failed validation step

### Common Error Types

| Error Type | First Action | Common Cause |
|---|---|---|
| Type error | Fix the source type | DTO mismatch or unsafe null handling |
| Module not found | Check import path and dependency | Wrong alias or missing package |
| Env error | Check server/client env usage | Missing variable or leaked secret |
| Auth error | Verify session and role checks | Missing guard or wrong route scope |
| Query error | Check schema and filters | Missing `hospitalId` or policy mismatch |

---

## CI/CD Expectation

Recommended pipeline stages:

1. Install dependencies
2. Lint
3. Test
4. Build
5. Validate migrations if changed

---

## Pre-Commit Checklist

Before any commit:

```bash
npm run lint
npm run test
npm run build
```

Success criteria:

- lint passes
- tests pass
- build succeeds
- relevant DB checks pass

---

## Common Web Gotchas

1. Importing server-only code into client components
2. Exposing secrets to the browser
3. Missing route protection
4. Missing `hospitalId` scoping in queries
5. Upload routes without validation

---

## See Also

- [Coding Standards](./coding-standards.md) — coding rules
- [Testing Patterns](./testing-patterns.md) — test guidance
- [Git Workflow](./git-workflow.md) — commit and PR conventions
