-- KharchaSplit v2 — investments + recurring rules
-- Additive; does not modify v1 tables.
-- Run AFTER 0001_init.sql in Supabase SQL Editor.

-- ─── investments ──────────────────────────────────────────────────────
create table if not exists public.investments (
  id          uuid primary key default gen_random_uuid(),
  workspace   text not null,
  name        varchar(100) not null,
  category    varchar(30) not null default 'other-inv',
  principal   decimal(14, 2) not null check (principal > 0),
  start_date  date not null default current_date,
  note        text,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── investment_valuations ────────────────────────────────────────────
create table if not exists public.investment_valuations (
  id             uuid primary key default gen_random_uuid(),
  workspace      text not null,
  investment_id  uuid not null references public.investments(id) on delete cascade,
  value          decimal(14, 2) not null check (value >= 0),
  date           date not null default current_date,
  created_at     timestamptz default now(),
  unique (investment_id, date)
);

-- ─── recurring_rules ──────────────────────────────────────────────────
create table if not exists public.recurring_rules (
  id                   uuid primary key default gen_random_uuid(),
  workspace            text not null,
  rule_type            varchar(20) not null check (rule_type in ('expense', 'valuation')),
  template             jsonb not null,
  frequency            varchar(10) not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  anchor_day           smallint,
  end_type             varchar(10) not null default 'never' check (end_type in ('never', 'on_date', 'after_count')),
  end_date             date,
  end_count            smallint,
  generated_count      smallint default 0,
  last_generated_date  date,
  is_active            boolean default true,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- ─── indexes ──────────────────────────────────────────────────────────
create index if not exists idx_investments_workspace on public.investments(workspace);
create index if not exists idx_investments_category on public.investments(category);
create index if not exists idx_valuations_workspace on public.investment_valuations(workspace);
create index if not exists idx_valuations_investment on public.investment_valuations(investment_id);
create index if not exists idx_valuations_date on public.investment_valuations(date desc);
create index if not exists idx_valuations_latest on public.investment_valuations(investment_id, date desc);
create index if not exists idx_recurring_workspace on public.recurring_rules(workspace);
create index if not exists idx_recurring_active on public.recurring_rules(workspace, is_active) where is_active;

-- ─── triggers ─────────────────────────────────────────────────────────
drop trigger if exists investments_touch on public.investments;
create trigger investments_touch before update on public.investments
  for each row execute procedure public.touch_updated_at();

drop trigger if exists recurring_rules_touch on public.recurring_rules;
create trigger recurring_rules_touch before update on public.recurring_rules
  for each row execute procedure public.touch_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────
alter table public.investments enable row level security;
alter table public.investment_valuations enable row level security;
alter table public.recurring_rules enable row level security;

drop policy if exists "investments_all" on public.investments;
drop policy if exists "valuations_all" on public.investment_valuations;
drop policy if exists "recurring_all" on public.recurring_rules;

create policy "investments_all"  on public.investments         for all using (true) with check (true);
create policy "valuations_all"   on public.investment_valuations for all using (true) with check (true);
create policy "recurring_all"    on public.recurring_rules       for all using (true) with check (true);
