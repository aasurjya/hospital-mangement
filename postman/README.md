# HospitalOS Postman Collection

Seed your local Supabase database with realistic test data via Postman.

## Quick Start

1. Start local Supabase and copy the service role key:

   ```bash
   npx supabase start
   # Copy the "service_role key" from the output
   ```

2. Import into Postman:
   - `HospitalOS.postman_collection.json`
   - `Local.postman_environment.json`

3. Set the `service_role_key` variable:
   - Click the environment dropdown (top-right) -> select **HospitalOS Local**
   - Click the eye icon -> paste your service role key into `service_role_key`

4. Run the collection:
   - Click the collection -> **Run** -> **Run HospitalOS**
   - All ~40 requests execute in order, each saving IDs for later requests

## Login Credentials

After seeding, log in at `http://localhost:3000/login`:

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | `corp.asurjya@gmail.com` | *(your existing password)* |
| Hospital Admin (City General) | `admin@citygeneral.dev` | `DevAdmin@2026!` |
| Hospital Admin (Riverside) | `admin@riverside.dev` | `DevAdmin@2026!` |
| Doctor 1 (City General) | `dr.wilson@citygeneral.dev` | `DevAdmin@2026!` |
| Doctor 2 (City General) | `dr.park@citygeneral.dev` | `DevAdmin@2026!` |
| Nurse (City General) | `nurse.santos@citygeneral.dev` | `DevAdmin@2026!` |
| Receptionist (City General) | `reception@citygeneral.dev` | `DevAdmin@2026!` |
| Doctor (Riverside) | `dr.patel@riverside.dev` | `DevAdmin@2026!` |

## Test Data Summary

| Entity | City General | Riverside |
|--------|-------------|-----------|
| Hospitals | 1 | 1 |
| Staff | 5 (1 admin, 2 doctors, 1 nurse, 1 receptionist) | 2 (1 admin, 1 doctor) |
| Departments | 3 (Emergency, Internal Medicine, Cardiology) | 2 (Emergency, Pediatrics) |
| Rooms | 6 (General, Private, Semi-Private, ICU, ER x2) | 2 (General, Pediatric) |
| Patients | 8 | 2 |
| Appointments | 8 (various statuses) | 0 |
| Admissions | 3 (2 admitted, 1 discharged) | 1 (admitted) |
| Medical Records | 5 (3 draft, 2 finalized) | 0 |

## Resetting

To start fresh, reset the database and re-run the collection:

```bash
npx supabase db reset
```
