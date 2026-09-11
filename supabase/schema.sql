-- Insurance Ledger schema
-- Run this once in Supabase: Project -> SQL Editor -> New query -> paste -> Run

create extension if not exists "pgcrypto";

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  vehicle text not null,
  policy_type text,
  policy_number text,
  description text,
  amount numeric(12,2) not null default 0,
  date_issued date,
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entries(id) on delete cascade,
  amount numeric(12,2) not null,
  date date not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists entries_client_id_idx on entries(client_id);
create index if not exists payments_entry_id_idx on payments(entry_id);

-- Row Level Security: this is a single-operator app, so any signed-in user
-- (i.e. only you, since you won't create other accounts) can read/write everything.
alter table clients enable row level security;
alter table entries enable row level security;
alter table payments enable row level security;

create policy "authenticated full access" on clients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on entries
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated full access" on payments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
