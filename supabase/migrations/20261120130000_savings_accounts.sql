-- ---------------------------------------------------------------------------
-- Savings / investments
--
-- Goal-based saving lives in savings_goals. This table is for money that is
-- put aside outside a goal: demand savings, term deposits, bonds, stocks and
-- similar holdings. Liquidity tells the UI what can be withdrawn immediately.
-- ---------------------------------------------------------------------------

create type public.savings_account_type as enum (
  'savings',
  'investment',
  'bond',
  'stock',
  'other'
);

create type public.savings_liquidity as enum (
  'instant',
  'term',
  'long_term'
);

create table public.savings_accounts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null check (char_length(trim(name)) between 1 and 120),
  type           public.savings_account_type not null default 'savings',
  institution    text not null default '',
  balance        numeric(18, 2) not null default 0 check (balance >= 0),
  currency       text not null default 'MNT' check (public.is_supported_currency(currency)),
  expected_rate  numeric(6, 3) not null default 0 check (expected_rate >= 0),
  liquidity      public.savings_liquidity not null default 'instant',
  maturity_date  date,
  note           text check (note is null or char_length(note) <= 500),
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.savings_accounts is
  'Savings and investments outside goal-based saving. balance is the current value.';

comment on column public.savings_accounts.expected_rate is
  'Expected annual return in percent, e.g. 12.500 = 12.5%.';

comment on column public.savings_accounts.liquidity is
  'instant = withdraw now, term = fixed term, long_term = long-term holding.';

create trigger savings_accounts_set_updated_at
  before update on public.savings_accounts
  for each row execute function public.set_updated_at();

create index savings_accounts_user_idx
  on public.savings_accounts (user_id, created_at);

create index savings_accounts_user_active_idx
  on public.savings_accounts (user_id) where not is_archived;

alter table public.savings_accounts enable row level security;

create policy "savings_accounts_all_own" on public.savings_accounts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.savings_accounts to authenticated;
