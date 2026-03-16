-- Migration: Billing — invoices, line items, and payments.

-- Invoice status enum
do $$ begin
  create type public.invoice_status as enum (
    'DRAFT', 'ISSUED', 'PAID', 'PARTIAL', 'VOID'
  );
exception when duplicate_object then null;
end $$;

-- Payment method enum
do $$ begin
  create type public.payment_method as enum (
    'CASH', 'CHECK', 'BANK_TRANSFER', 'MOBILE_MONEY', 'INSURANCE', 'OTHER'
  );
exception when duplicate_object then null;
end $$;

-- ─── Invoices ───────────────────────────────────────────────────────────────

create table if not exists public.invoices (
  id              uuid primary key default extensions.uuid_generate_v4(),
  hospital_id     uuid not null references public.hospitals (id) on delete cascade,
  patient_id      uuid not null references public.patients (id) on delete cascade,
  admission_id    uuid references public.admissions (id) on delete set null,
  appointment_id  uuid references public.appointments (id) on delete set null,
  invoice_number  text not null,
  status          public.invoice_status not null default 'DRAFT',
  issued_at       timestamptz,
  due_date        date,
  subtotal        numeric(12,2) not null default 0,
  tax_rate        numeric(5,4) not null default 0,
  tax_amount      numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  amount_paid     numeric(12,2) not null default 0,
  notes           text,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists invoices_hospital_number_uniq
  on public.invoices (hospital_id, invoice_number);
create index if not exists invoices_hospital_id_idx on public.invoices (hospital_id);
create index if not exists invoices_patient_id_idx on public.invoices (patient_id);
create index if not exists invoices_status_idx on public.invoices (hospital_id, status);
create index if not exists invoices_created_at_idx on public.invoices (hospital_id, created_at desc);

drop trigger if exists invoices_updated_at on public.invoices;
create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;

create policy "platform_admin_all_invoices"
  on public.invoices for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "hospital_staff_manage_invoices"
  on public.invoices for all
  using (hospital_id = public.my_hospital_id())
  with check (hospital_id = public.my_hospital_id());

-- ─── Invoice Items ──────────────────────────────────────────────────────────

create table if not exists public.invoice_items (
  id            uuid primary key default extensions.uuid_generate_v4(),
  invoice_id    uuid not null references public.invoices (id) on delete cascade,
  description   text not null,
  quantity      numeric(10,2) not null default 1,
  unit_price    numeric(12,2) not null,
  total         numeric(12,2) not null,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

alter table public.invoice_items enable row level security;

create policy "platform_admin_all_invoice_items"
  on public.invoice_items for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "hospital_staff_manage_invoice_items"
  on public.invoice_items for all
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and i.hospital_id = public.my_hospital_id()
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and i.hospital_id = public.my_hospital_id()
    )
  );

-- ─── Payments ───────────────────────────────────────────────────────────────

create table if not exists public.payments (
  id              uuid primary key default extensions.uuid_generate_v4(),
  invoice_id      uuid not null references public.invoices (id) on delete cascade,
  hospital_id     uuid not null references public.hospitals (id) on delete cascade,
  amount          numeric(12,2) not null,
  method          public.payment_method not null default 'CASH',
  reference       text,
  notes           text,
  paid_at         timestamptz not null default now(),
  recorded_by     uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists payments_invoice_id_idx on public.payments (invoice_id);
create index if not exists payments_hospital_id_idx on public.payments (hospital_id);

alter table public.payments enable row level security;

create policy "platform_admin_all_payments"
  on public.payments for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "hospital_staff_manage_payments"
  on public.payments for all
  using (hospital_id = public.my_hospital_id())
  with check (hospital_id = public.my_hospital_id());
