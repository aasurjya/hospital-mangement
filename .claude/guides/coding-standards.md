# Coding Standards — Next.js/TypeScript

When reviewing or writing code in this hospital management web project, enforce the following standards. Flag violations clearly and suggest specific fixes.

---

## Type Safety

### Strong Typing

- Prefer explicit domain types over `any`
- Use `unknown` for untrusted external input
- Validate request payloads at the boundary
- Keep server and client data models aligned

```ts
// BAD
const body: any = await req.json()

// GOOD
const input = schema.parse(await req.json())
```

### Null and Scope Safety

- Do not assume `hospitalId` exists for `PLATFORM_ADMIN`
- Resolve role and scope from the authenticated session
- Never trust client-supplied role or hospital identifiers

---

## Next.js Architecture

### Server and Client Boundaries

- Prefer Server Components by default
- Use Client Components only when interaction requires them
- Keep privileged logic on the server
- Do not import server-only utilities into client code

### Route Design

- Platform admin routes must be clearly separated from hospital routes
- Hospital routes must enforce hospital membership
- Sensitive mutations belong in server handlers or server actions

---

## Security Rules

### Password Handling

- Passwords must be hashed before storage
- Never log raw passwords
- If a reset password is generated, show it once only
- Do not build features that reveal historical passwords

### Authorization

- Platform admin routes require `PLATFORM_ADMIN`
- Hospital admin actions must be limited to one hospital
- Role checks must happen on the server
- File downloads and chat access must verify membership and scope

### Audit Logging

Log and retain audit entries for:

- User creation
- Password reset
- Role change
- Sensitive access flows when implemented

---

## Multi-Tenant Safety

### `hospitalId` Scoping

Every hospital-scoped query must be restricted by `hospitalId` unless the action is an explicit cross-hospital platform flow.

```ts
// BAD
const patients = await db.patient.findMany()

// GOOD
const patients = await db.patient.findMany({
  where: { hospitalId: session.hospitalId },
})
```

### Pagination

All admin list views should paginate:

- users
- patients
- appointments
- bills
- messages

---

## Input and Error Handling

### Validation

- Validate all request payloads on the server
- Validate file type and size for uploads
- Return safe user-facing error messages
- Do not leak stack traces or internal details

### Error Handling

- Never silently swallow errors
- Distinguish auth, validation, and infrastructure failures
- Use consistent error shapes for APIs and server actions

---

## Naming Conventions

### Files

- Route segments: `app/(platform)/admin/page.tsx`
- Components: `user-table.tsx`
- Utilities: `lib/auth.ts`
- Schema: `prisma/schema.prisma`

### Code Symbols

- Components and types use `PascalCase`
- Variables and functions use `camelCase`
- Constants use `UPPER_SNAKE_CASE` only for real constants

---

## File Organization

```text
app/
  (auth)/
  (platform)/
  (hospital)/
  (staff)/
components/
lib/
prisma/
scripts/
md/
```

Keep files focused and extract helpers or subcomponents before they become difficult to review.

---

## UI Expectations

- Accessible forms
- Clear role-based navigation
- Professional admin interface for hospital operations
- Loading, empty, and error states on async surfaces
- Avoid exposing sensitive data in shared screens

---

## See Also

- [Testing Patterns](./testing-patterns.md) — web testing guidance
- [Build Validation](./build-validation.md) — lint, test, and build workflow
- [Git Workflow](./git-workflow.md) — commit and PR conventions
