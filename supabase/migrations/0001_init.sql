-- Kaka — initial schema (applied to Supabase project "kaka")
-- Every table: per-user rows, RLS (owner only), updated_at trigger.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  conversation_id uuid not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  input_mode text not null default 'text' check (input_mode in ('text','voice')),
  provider text
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  category text not null check (category in ('work','food','finance','debt','health','social','career','note')),
  raw_text text not null,
  occurred_at timestamptz not null default now(),
  source_message_id uuid references public.messages(id) on delete set null,
  confidence numeric default 1.0,
  status text not null default 'confirmed' check (status in ('confirmed','pending','discarded')),
  detail_table text,
  detail_id uuid,
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  entry_id uuid references public.entries(id) on delete cascade,
  work_date date not null default current_date,
  punch_in time, punch_out time, hours numeric, notes text
);

create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  entry_id uuid references public.entries(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  meal_type text not null default 'other' check (meal_type in ('breakfast','lunch','dinner','snack','other')),
  description text not null,
  cost numeric,
  currency text not null default 'AED'
);

create table if not exists public.finance_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  entry_id uuid references public.entries(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  type text not null check (type in ('expense','income','transfer')),
  amount numeric not null,
  currency text not null default 'AED',
  counterparty text, note text, tag text
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  entry_id uuid references public.entries(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  counterparty text not null,
  direction text not null check (direction in ('lent','borrowed')),
  amount numeric not null,
  currency text not null default 'AED',
  due_date date,
  status text not null default 'open' check (status in ('open','settled')),
  note text
);

create table if not exists public.debt_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  debt_id uuid not null references public.debts(id) on delete cascade,
  amount numeric not null,
  settled_on date not null default current_date,
  note text
);

create table if not exists public.health_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  entry_id uuid references public.entries(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  kind text not null check (kind in ('sleep','drink','exercise','mood','symptom','other')),
  value text not null,
  numeric_value numeric,
  notes text
);

create table if not exists public.social_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  entry_id uuid references public.entries(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  person text not null,
  channel text not null default 'other' check (channel in ('call','visit','message','other')),
  duration_min int,
  notes text
);

create table if not exists public.career_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  entry_id uuid references public.entries(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  kind text not null default 'other' check (kind in ('application','lead','interview','skill','other')),
  title text not null,
  org text, status text, notes text
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  layer text not null check (layer in ('core','episodic','pattern')),
  content text not null,
  importance int not null default 3 check (importance between 1 and 5),
  pinned boolean not null default false,
  status text not null default 'proposed' check (status in ('proposed','approved','rejected')),
  source_entry_ids uuid[] not null default '{}'
);

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  period text not null check (period in ('week','month')),
  period_start date not null,
  content text not null,
  data jsonb not null default '{}'::jsonb
);

create table if not exists public.entry_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  entry_id uuid references public.entries(id) on delete set null,
  table_name text not null,
  row_id uuid not null,
  old_value jsonb, new_value jsonb,
  action text not null check (action in ('edit','delete','restore')),
  changed_at timestamptz not null default now()
);

create table if not exists public.api_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  provider text not null,
  endpoint text not null,
  status int, latency_ms int, error text
);

-- RLS + owner-only policies + updated_at triggers for every table
do $$
declare t text;
begin
  foreach t in array array['messages','entries','work_logs','food_logs','finance_logs','debts',
    'debt_settlements','health_logs','social_logs','career_logs','memories','insights','entry_history','api_log']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_owner', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t||'_owner', t);
    execute format('drop trigger if exists %I on public.%I', 'trg_'||t||'_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'trg_'||t||'_updated_at', t);
    execute format('create index if not exists %I on public.%I (user_id)', 'idx_'||t||'_user', t);
  end loop;
end $$;

create index if not exists idx_messages_conv on public.messages (user_id, conversation_id, created_at);
create index if not exists idx_entries_user_time on public.entries (user_id, occurred_at desc);
create index if not exists idx_entries_user_cat on public.entries (user_id, category);
create index if not exists idx_entries_msg on public.entries (source_message_id);
create index if not exists idx_work_user_date on public.work_logs (user_id, work_date desc);
create index if not exists idx_food_user_time on public.food_logs (user_id, occurred_at desc);
create index if not exists idx_fin_user_time on public.finance_logs (user_id, occurred_at desc);
create index if not exists idx_debts_user_status on public.debts (user_id, status);
create index if not exists idx_health_user_time on public.health_logs (user_id, occurred_at desc);
create index if not exists idx_social_user_time on public.social_logs (user_id, occurred_at desc);
create index if not exists idx_career_user_time on public.career_logs (user_id, occurred_at desc);
create index if not exists idx_memories_user_layer on public.memories (user_id, layer, status);
create index if not exists idx_insights_user_period on public.insights (user_id, period, period_start desc);
create index if not exists idx_api_log_user_time on public.api_log (user_id, created_at desc);
create index if not exists idx_settle_debt on public.debt_settlements (debt_id);
create index if not exists idx_food_entry on public.food_logs (entry_id);
create index if not exists idx_fin_entry on public.finance_logs (entry_id);
create index if not exists idx_work_entry on public.work_logs (entry_id);
create index if not exists idx_debts_entry on public.debts (entry_id);
create index if not exists idx_health_entry on public.health_logs (entry_id);
create index if not exists idx_social_entry on public.social_logs (entry_id);
create index if not exists idx_career_entry on public.career_logs (entry_id);
create index if not exists idx_history_entry on public.entry_history (entry_id);
