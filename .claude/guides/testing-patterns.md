# Testing Patterns Guide — Next.js

Canonical guide for writing tests in this hospital management web project.

---

## Philosophy

### Results Over Presence

Tests should verify behavior and scope, not just that something exists.

```ts
// BAD
expect(result).toBeTruthy()

// GOOD
expect(result.role).toBe('HOSPITAL_ADMIN')
expect(result.hospitalId).toBe(hospitalId)
```

### TDD Where Practical

Use test-first development for critical business logic:

1. write the failing test
2. implement the minimum solution
3. refactor safely

---

## Test File Organization

```text
test/
  app/
  components/
  lib/
```

Mirror the source structure when practical.

---

## Server Logic Testing

```ts
describe('createHospitalUser', () => {
  it('scopes the user to the target hospital', async () => {
    const result = await createHospitalUser({
      hospitalId: 'hospital_1',
      role: 'DOCTOR',
      email: 'doctor@example.com',
    })

    expect(result.hospitalId).toBe('hospital_1')
    expect(result.role).toBe('DOCTOR')
  })
})
```

---

## UI Testing

```ts
it('shows validation error for empty login form', async () => {
  render(<LoginForm />)

  await userEvent.click(screen.getByRole('button', { name: /login/i }))

  expect(screen.getByText(/email is required/i)).toBeInTheDocument()
})
```

---

## Data Access Testing

```ts
it('filters patients by hospitalId', async () => {
  const session = { role: 'HOSPITAL_ADMIN', hospitalId: 'hospital_1' }
  const result = await listPatients(session)

  expect(result.every((patient) => patient.hospitalId === 'hospital_1')).toBe(true)
})
```

---

## Required Edge Cases

For server logic and repositories, test:

1. empty result
2. error state
3. hospital isolation
4. pagination
5. platform admin cross-hospital scope
6. invalid input

For pages and components, test:

1. loading state
2. success state
3. error state
4. empty state
5. hidden or disabled actions for unauthorized roles

---

## Anti-Patterns To Avoid

1. Testing mock calls without asserting results
2. Weak assertions like `toBeTruthy()`
3. Shared state leaking between tests
4. Real Supabase network calls in unit tests
5. Skipping auth and scope checks
6. Skipping failure paths

---

## See Also

- [Coding Standards](./coding-standards.md) — coding rules
- [Build Validation](./build-validation.md) — lint, test, and build workflow
