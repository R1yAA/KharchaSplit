-- KharchaSplit schema (v1)
-- Workspace-scoped: each "workspace" string is one independent user's data.
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- ─── groups ───────────────────────────────────────────────────────────
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  workspace text not null,
  name varchar(100) not null,
  icon varchar(10) default '📦',
  members text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── expenses ─────────────────────────────────────────────────────────
-- For group expenses: group_id set, is_personal=false.
-- For personal expenses: group_id null, is_personal=true.
-- Multi-payer support via paid_by_members / paid_by_amounts (parallel arrays).
-- Single-payer convenience: paid_by holds the single member name (legacy field).
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  workspace text not null,
  group_id uuid references public.groups(id) on delete cascade,
  title varchar(100) not null,
  amount decimal(12, 2) not null check (amount > 0),
  category varchar(30) not null default 'other',
  paid_by varchar(50),
  paid_by_members text[] default '{}',
  paid_by_amounts decimal(12, 2)[] default '{}',
  split_type varchar(10) default 'equal' check (split_type in ('equal', 'unequal')),
  split_members text[] default '{}',
  split_amounts decimal(12, 2)[] default '{}',
  date date not null default current_date,
  note text,
  is_personal boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── settlements ──────────────────────────────────────────────────────
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  workspace text not null,
  group_id uuid references public.groups(id) on delete cascade,
  from_member varchar(50) not null,
  to_member varchar(50) not null,
  amount decimal(12, 2) not null,
  is_paid boolean default false,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ─── settings ─────────────────────────────────────────────────────────
-- One row per workspace.
create table if not exists public.settings (
  workspace text primary key,
  user_name varchar(50) default 'Me',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── indexes ──────────────────────────────────────────────────────────
create index if not exists idx_groups_workspace on public.groups(workspace);
create index if not exists idx_expenses_workspace on public.expenses(workspace);
create index if not exists idx_expenses_group on public.expenses(group_id);
create index if not exists idx_expenses_date on public.expenses(date desc);
create index if not exists idx_expenses_personal on public.expenses(workspace, is_personal) where is_personal = true;
create index if not exists idx_expenses_category on public.expenses(category);
create index if not exists idx_settlements_group on public.settlements(group_id);
create index if not exists idx_settlements_workspace on public.settlements(workspace);

-- ─── updated_at trigger ───────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists groups_touch on public.groups;
create trigger groups_touch before update on public.groups
  for each row execute procedure public.touch_updated_at();

drop trigger if exists expenses_touch on public.expenses;
create trigger expenses_touch before update on public.expenses
  for each row execute procedure public.touch_updated_at();

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute procedure public.touch_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────
-- v1 has no auth (username-only). Anon role needs read/write.
-- Lock down later when adding Supabase Auth.
alter table public.groups       enable row level security;
alter table public.expenses     enable row level security;
alter table public.settlements  enable row level security;
alter table public.settings     enable row level security;

drop policy if exists "anon all groups"       on public.groups;
drop policy if exists "anon all expenses"     on public.expenses;
drop policy if exists "anon all settlements"  on public.settlements;
drop policy if exists "anon all settings"     on public.settings;

create policy "anon all groups"      on public.groups       for all using (true) with check (true);
create policy "anon all expenses"    on public.expenses     for all using (true) with check (true);
create policy "anon all settlements" on public.settlements  for all using (true) with check (true);
create policy "anon all settings"    on public.settings     for all using (true) with check (true);
