-- ============================================================================
--  Санхүү — personal finance schema
--  ---------------------------------------------------------------------------
--  Multi-user from day one:
--    * every row has user_id
--    * RLS is enabled and enforced on every table
--    * workspace_id is nullable, ready for the later business workspace
--
--  Money is numeric(18,2), never float. Wallet balances are never stored:
--  they are derived in public.wallet_balances.
--
--  Apply:  supabase db push      (remote)
--          supabase db reset     (local, re-runs all migrations)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
create type public.wallet_type as enum (
  'cash',
  'bank_account',
  'card',
  'e_wallet',
  'savings',
  'investment'
);

create type public.category_type as enum ('income', 'expense');

create type public.transaction_type as enum ('income', 'expense', 'transfer');

create type public.recurring_frequency as enum (
  'daily',
  'weekly',
  'monthly',
  'yearly'
);

create type public.debt_type as enum ('i_owe', 'owed_to_me');

create type public.debt_status as enum ('active', 'paid', 'overdue');

create type public.loan_payment_type as enum ('annuity', 'equal_principal');

-- ---------------------------------------------------------------------------
-- 2. Shared helpers
-- ---------------------------------------------------------------------------

-- Keep updated_at honest on every table that has it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Today's date in Ulaanbaatar (UTC+8), independent of the database timezone.
create or replace function public.ub_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Ulaanbaatar')::date;
$$;

-- Supported currencies (MNT primary, others for travel/foreign wallets).
create or replace function public.is_supported_currency(p_currency text)
returns boolean
language sql
immutable
as $$
  select p_currency in ('MNT', 'USD', 'EUR', 'CNY', 'KRW', 'JPY', 'RUB');
$$;

-- ---------------------------------------------------------------------------
-- 3. Tables
-- ---------------------------------------------------------------------------

-- 3.1 profiles ---------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  currency     text not null default 'MNT' check (public.is_supported_currency(currency)),
  locale       text not null default 'mn',
  theme        text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth user. Created by the signup trigger.';

-- 3.2 wallets ----------------------------------------------------------------
create table public.wallets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  workspace_id     uuid,
  name            text not null check (char_length(trim(name)) between 1 and 80),
  type            public.wallet_type not null default 'cash',
  currency        text not null default 'MNT' check (public.is_supported_currency(currency)),
  initial_balance numeric(18, 2) not null default 0,
  color           text not null default '#2563eb',
  icon            text not null default 'wallet',
  is_archived     boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Referenced by composite FKs so a row can never point at another user's wallet.
  unique (id, user_id)
);

comment on table public.wallets is
  'Balances are derived in public.wallet_balances; never store a running balance.';

-- 3.3 categories -------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        public.category_type not null,
  name        text not null check (char_length(trim(name)) between 1 and 80),
  icon        text not null default 'circle',
  color       text not null default '#64748b',
  parent_id   uuid references public.categories (id) on delete cascade,
  is_archived boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (user_id, type, name),
  unique (id, user_id)
);

comment on table public.categories is
  'Default Mongolian categories are seeded per user on signup.';

-- 3.4 recurring_rules --------------------------------------------------------
create table public.recurring_rules (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  workspace_id    uuid,
  frequency      public.recurring_frequency not null default 'monthly',
  interval_count integer not null default 1 check (interval_count > 0),
  next_run       date not null default public.ub_today(),
  last_run       date,
  is_active      boolean not null default true,

  -- Transaction template
  type           public.transaction_type not null,
  amount         numeric(18, 2) not null check (amount > 0),
  currency       text not null default 'MNT' check (public.is_supported_currency(currency)),
  wallet_id      uuid not null,
  category_id    uuid references public.categories (id) on delete set null,
  to_wallet_id   uuid,
  note           text,
  tags           text[] not null default '{}',

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint recurring_rules_wallet_fk
    foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete cascade,
  constraint recurring_rules_to_wallet_fk
    foreign key (to_wallet_id, user_id) references public.wallets (id, user_id) on delete cascade,
  constraint recurring_rules_transfer_check check (
    (type = 'transfer' and to_wallet_id is not null and to_wallet_id <> wallet_id)
    or (type <> 'transfer' and to_wallet_id is null)
  )
);

-- 3.5 transactions -----------------------------------------------------------
create table public.transactions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  workspace_id          uuid,
  wallet_id            uuid not null,
  category_id          uuid references public.categories (id) on delete set null,
  type                 public.transaction_type not null,
  amount               numeric(18, 2) not null check (amount > 0),
  currency             text not null default 'MNT' check (public.is_supported_currency(currency)),
  occurred_at          date not null default public.ub_today(),
  note                 text check (note is null or char_length(note) <= 500),
  to_wallet_id         uuid,
  tags                 text[] not null default '{}',
  is_recurring_instance boolean not null default false,
  recurring_rule_id    uuid references public.recurring_rules (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint transactions_wallet_fk
    foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete restrict,
  constraint transactions_to_wallet_fk
    foreign key (to_wallet_id, user_id) references public.wallets (id, user_id) on delete restrict,

  -- A transfer moves money between two distinct wallets.
  constraint transactions_transfer_target_check check (
    (type = 'transfer' and to_wallet_id is not null and to_wallet_id <> wallet_id)
    or (type <> 'transfer' and to_wallet_id is null)
  ),
  -- Transfers are not categorised.
  constraint transactions_transfer_category_check check (
    type <> 'transfer' or category_id is null
  )
);

comment on table public.transactions is
  'type=transfer uses wallet_id as the source and to_wallet_id as the destination.';

-- 3.6 budgets ----------------------------------------------------------------
create table public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid,
  category_id uuid not null,
  month       date not null check (month = date_trunc('month', month)::date),
  amount      numeric(18, 2) not null check (amount > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint budgets_category_fk
    foreign key (category_id, user_id) references public.categories (id, user_id) on delete cascade,
  unique (user_id, category_id, month)
);

-- 3.7 savings_goals ----------------------------------------------------------
create table public.savings_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  workspace_id    uuid,
  name           text not null check (char_length(trim(name)) between 1 and 120),
  target_amount  numeric(18, 2) not null check (target_amount > 0),
  current_amount numeric(18, 2) not null default 0 check (current_amount >= 0),
  currency       text not null default 'MNT' check (public.is_supported_currency(currency)),
  target_date    date,
  wallet_id      uuid,
  color          text not null default '#2563eb',
  icon           text not null default 'target',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Wallets are archived, not deleted, once they have history.
  constraint savings_goals_wallet_fk
    foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete restrict,
  unique (id, user_id)
);

comment on column public.savings_goals.current_amount is
  'Maintained by the goal_contributions trigger so it always equals SUM(contributions).';

-- 3.8 goal_contributions -----------------------------------------------------
create table public.goal_contributions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  goal_id        uuid not null,
  amount         numeric(18, 2) not null check (amount > 0),
  contributed_at date not null default public.ub_today(),
  wallet_id      uuid,
  note           text,
  created_at     timestamptz not null default now(),

  constraint goal_contributions_goal_fk
    foreign key (goal_id, user_id) references public.savings_goals (id, user_id) on delete cascade,
  constraint goal_contributions_wallet_fk
    foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete restrict
);

-- 3.9 debts ------------------------------------------------------------------
create table public.debts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  workspace_id   uuid,
  type          public.debt_type not null,
  counterparty  text not null check (char_length(trim(counterparty)) between 1 and 120),
  principal     numeric(18, 2) not null check (principal > 0),
  interest_rate numeric(6, 3) not null default 0 check (interest_rate >= 0),
  start_date    date not null default public.ub_today(),
  due_date      date,
  status        public.debt_status not null default 'active',
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  check (due_date is null or due_date >= start_date),
  unique (id, user_id)
);

comment on column public.debts.interest_rate is 'Annual percentage, e.g. 12.500 = 12.5%.';

-- 3.10 debt_payments ---------------------------------------------------------
create table public.debt_payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  debt_id    uuid not null,
  amount     numeric(18, 2) not null check (amount > 0),
  paid_at    date not null default public.ub_today(),
  wallet_id  uuid,
  note       text,
  created_at timestamptz not null default now(),

  constraint debt_payments_debt_fk
    foreign key (debt_id, user_id) references public.debts (id, user_id) on delete cascade,
  constraint debt_payments_wallet_fk
    foreign key (wallet_id, user_id) references public.wallets (id, user_id) on delete restrict
);

-- 3.11 loans -----------------------------------------------------------------
create table public.loans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  workspace_id  uuid,
  lender       text not null check (char_length(trim(lender)) between 1 and 120),
  principal    numeric(18, 2) not null check (principal > 0),
  annual_rate  numeric(6, 3) not null default 0 check (annual_rate >= 0),
  term_months  integer not null check (term_months > 0),
  start_date   date not null default public.ub_today(),
  payment_type public.loan_payment_type not null default 'annuity',
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 3.12 net_worth_snapshots ---------------------------------------------------
create table public.net_worth_snapshots (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid,
  date        date not null default public.ub_today(),
  assets      numeric(18, 2) not null default 0,
  liabilities numeric(18, 2) not null default 0,
  created_at  timestamptz not null default now(),

  unique (user_id, date)
);

-- ---------------------------------------------------------------------------
-- 4. updated_at triggers
-- ---------------------------------------------------------------------------
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger wallets_set_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger recurring_rules_set_updated_at
  before update on public.recurring_rules
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

create trigger savings_goals_set_updated_at
  before update on public.savings_goals
  for each row execute function public.set_updated_at();

create trigger debts_set_updated_at
  before update on public.debts
  for each row execute function public.set_updated_at();

create trigger loans_set_updated_at
  before update on public.loans
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Business rules as triggers
-- ---------------------------------------------------------------------------

-- 5.1 transactions: category must belong to the user and match the type.
-- SECURITY DEFINER so the ownership check cannot be skipped via RLS visibility.
create or replace function public.validate_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category public.categories%rowtype;
begin
  if new.category_id is not null then
    select * into v_category from public.categories where id = new.category_id;

    if v_category.id is null then
      raise exception 'Ангилал олдсонгүй.';
    end if;

    if v_category.user_id <> new.user_id then
      raise exception 'Ангилал өөр хэрэглэгчийнх байна.';
    end if;

    if new.type <> 'transfer' and v_category.type::text <> new.type::text then
      raise exception 'Ангиллын төрөл гүйлгээний төрөлтэй тохирохгүй байна.';
    end if;
  end if;

  return new;
end;
$$;

create trigger transactions_validate
  before insert or update on public.transactions
  for each row execute function public.validate_transaction();

-- 5.2 goal contributions keep savings_goals.current_amount in sync.
create or replace function public.sync_goal_amount()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.savings_goals
       set current_amount = current_amount + new.amount
     where id = new.goal_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.savings_goals
       set current_amount = greatest(current_amount - old.amount, 0)
     where id = old.goal_id;
    return old;
  end if;

  -- UPDATE: move the contribution from the old goal to the new one.
  if old.goal_id = new.goal_id then
    update public.savings_goals
       set current_amount = greatest(current_amount - old.amount + new.amount, 0)
     where id = new.goal_id;
  else
    update public.savings_goals
       set current_amount = greatest(current_amount - old.amount, 0)
     where id = old.goal_id;
    update public.savings_goals
       set current_amount = current_amount + new.amount
     where id = new.goal_id;
  end if;

  return new;
end;
$$;

create trigger goal_contributions_sync
  after insert or update or delete on public.goal_contributions
  for each row execute function public.sync_goal_amount();

-- ---------------------------------------------------------------------------
-- 6. Derived views (RLS-safe via security_invoker)
-- ---------------------------------------------------------------------------

-- 6.1 Wallet balances
--  balance = initial_balance
--          + SUM(income into wallet)
--          − SUM(expense from wallet)
--          − SUM(transfers out) + SUM(transfers in)
create or replace view public.wallet_balances
with (security_invoker = true)
as
select
  w.id            as wallet_id,
  w.user_id,
  w.workspace_id,
  w.name,
  w.type,
  w.currency,
  w.color,
  w.icon,
  w.sort_order,
  w.is_archived,
  w.initial_balance,
  w.initial_balance + coalesce(sum(
    case
      when t.id is null then 0
      when t.type = 'income' then t.amount
      when t.type = 'expense' then -t.amount
      when t.type = 'transfer' and t.wallet_id = w.id then -t.amount
      when t.type = 'transfer' and t.to_wallet_id = w.id then t.amount
      else 0
    end
  ), 0)::numeric(18, 2) as balance
from public.wallets w
left join public.transactions t
  on t.user_id = w.user_id
 and (t.wallet_id = w.id or t.to_wallet_id = w.id)
group by w.id;

comment on view public.wallet_balances is
  'Live wallet balance. Assumes transfers happen between wallets of the same currency.';

-- 6.2 Debt balances
create or replace view public.debt_balances
with (security_invoker = true)
as
select
  d.id,
  d.user_id,
  d.workspace_id,
  d.type,
  d.counterparty,
  d.principal,
  d.interest_rate,
  d.start_date,
  d.due_date,
  d.status,
  d.note,
  coalesce(sum(p.amount), 0)::numeric(18, 2) as paid_amount,
  (d.principal - coalesce(sum(p.amount), 0))::numeric(18, 2) as remaining_amount
from public.debts d
left join public.debt_payments p
  on p.debt_id = d.id and p.user_id = d.user_id
group by d.id;

-- ---------------------------------------------------------------------------
-- 7. Loan math (mirrors /lib/finance/loan.ts, which is the source of truth
--    for the UI; this SQL copy is only used for net worth).
-- ---------------------------------------------------------------------------

-- Outstanding principal after the completed monthly payments before p_as_of.
-- annuity:         B_k = P(1+r)^k − A·((1+r)^k − 1)/r,
--                  A = P·r / (1 − (1+r)^−n)
-- equal_principal: B_k = P·(n − k)/n
create or replace function public.loan_outstanding_balance(
  p_principal    numeric,
  p_annual_rate  numeric,
  p_term_months  integer,
  p_start_date   date,
  p_payment_type public.loan_payment_type,
  p_as_of        date default public.ub_today()
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_rate      numeric;
  v_months    integer;
  v_payment   numeric;
  v_growth    numeric;
  v_remaining numeric;
begin
  if p_principal <= 0 or p_term_months <= 0 then
    return 0;
  end if;

  v_months := greatest(
    0,
    least(
      p_term_months,
      (extract(year from age(date_trunc('month', p_as_of), date_trunc('month', p_start_date))) * 12
       + extract(month from age(date_trunc('month', p_as_of), date_trunc('month', p_start_date))))::integer
    )
  );

  if v_months >= p_term_months then
    return 0;
  end if;

  if p_payment_type = 'equal_principal' then
    v_remaining := p_principal * (p_term_months - v_months)::numeric / p_term_months;
  else
    v_rate := p_annual_rate / 100 / 12;

    if v_rate = 0 then
      v_remaining := p_principal * (p_term_months - v_months)::numeric / p_term_months;
    else
      v_payment := p_principal * v_rate / (1 - power(1 + v_rate, -p_term_months));
      v_growth  := power(1 + v_rate, v_months);
      v_remaining := p_principal * v_growth - v_payment * (v_growth - 1) / v_rate;
    end if;
  end if;

  return round(greatest(v_remaining, 0), 2);
end;
$$;

comment on function public.loan_outstanding_balance is
  'Approximate outstanding principal: assumes every scheduled payment was made on time, no fees, no extra payments.';

-- ---------------------------------------------------------------------------
-- 8. Net worth
-- ---------------------------------------------------------------------------

-- assets      = all wallet balances + money owed to me
-- liabilities = money I owe + outstanding loan principal
create or replace function public.calculate_net_worth(
  p_user_id uuid,
  p_as_of   date default public.ub_today()
)
returns table (assets numeric, liabilities numeric, net_worth numeric)
language sql
stable
security invoker
set search_path = public
as $$
  with wallet_total as (
    select coalesce(sum(balance), 0)::numeric(18, 2) as value
    from public.wallet_balances
    where user_id = p_user_id
  ),
  receivable as (
    select coalesce(sum(greatest(remaining_amount, 0)), 0)::numeric(18, 2) as value
    from public.debt_balances
    where user_id = p_user_id
      and type = 'owed_to_me'
      and status <> 'paid'
  ),
  payable as (
    select coalesce(sum(greatest(remaining_amount, 0)), 0)::numeric(18, 2) as value
    from public.debt_balances
    where user_id = p_user_id
      and type = 'i_owe'
      and status <> 'paid'
  ),
  loan_total as (
    select coalesce(sum(public.loan_outstanding_balance(
             principal, annual_rate, term_months, start_date, payment_type, p_as_of
           )), 0)::numeric(18, 2) as value
    from public.loans
    where user_id = p_user_id
  )
  select
    (w.value + r.value)::numeric(18, 2) as assets,
    (p.value + l.value)::numeric(18, 2) as liabilities,
    (w.value + r.value - p.value - l.value)::numeric(18, 2) as net_worth
  from wallet_total w, receivable r, payable p, loan_total l;
$$;

-- Upserts today's snapshot for the calling user and returns it.
create or replace function public.capture_net_worth_snapshot(
  p_date date default public.ub_today()
)
returns public.net_worth_snapshots
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row  public.net_worth_snapshots;
begin
  if v_user is null then
    raise exception 'Нэвтрээгүй хэрэглэгч snapshot үүсгэх боломжгүй.';
  end if;

  insert into public.net_worth_snapshots (user_id, date, assets, liabilities)
  select v_user, p_date, nw.assets, nw.liabilities
  from public.calculate_net_worth(v_user, p_date) nw
  on conflict (user_id, date) do update
    set assets = excluded.assets,
        liabilities = excluded.liabilities
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Signup: profile + default wallet + Mongolian categories
-- ---------------------------------------------------------------------------

create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item record;
  v_sort integer;
begin
  -- Expense categories (Mongolia defaults)
  v_sort := 0;
  for v_item in
    select * from (values
      ('Хоол хүнс',              'shopping-basket', '#2563eb'),
      ('Гадуур хооллолт',        'utensils',        '#0ea5e9'),
      ('Тээвэр',                 'bus',             '#0e9384'),
      ('Түлш',                   'fuel',            '#d97706'),
      ('Байр/түрээс',            'house',           '#7c3aed'),
      ('Дулаан/цахилгаан/ус',    'zap',             '#eab308'),
      ('Интернэт/утас',          'wifi',            '#6366f1'),
      ('Эрүүл мэнд',             'heart-pulse',     '#db2777'),
      ('Боловсрол',              'graduation-cap',  '#0891b2'),
      ('Хувцас',                 'shirt',           '#c026d3'),
      ('Гэр ахуй',               'armchair',        '#65a30d'),
      ('Хүүхэд',                 'baby',            '#f97316'),
      ('Бэлэг/хандив',           'gift',            '#e11d48'),
      ('Үйлчилгээний шимтгэл',   'percent',         '#64748b'),
      ('Зээлийн төлөлт',         'credit-card',     '#475569'),
      ('Бусад',                  'ellipsis',        '#94a3b8')
    ) as v(name, icon, color)
  loop
    insert into public.categories (user_id, type, name, icon, color, sort_order)
    values (p_user_id, 'expense', v_item.name, v_item.icon, v_item.color, v_sort)
    on conflict (user_id, type, name) do nothing;
    v_sort := v_sort + 10;
  end loop;

  -- Income categories
  v_sort := 0;
  for v_item in
    select * from (values
      ('Цалин',                  'briefcase',   '#0e9384'),
      ('Бонус',                  'sparkles',    '#0ea5e9'),
      ('Бизнесийн орлого',       'building-2',  '#2563eb'),
      ('Хөрөнгө оруулалт',       'trending-up', '#7c3aed'),
      ('Түрээсийн орлого',       'key-round',   '#d97706'),
      ('Бусад',                  'ellipsis',    '#94a3b8')
    ) as v(name, icon, color)
  loop
    insert into public.categories (user_id, type, name, icon, color, sort_order)
    values (p_user_id, 'income', v_item.name, v_item.icon, v_item.color, v_sort)
    on conflict (user_id, type, name) do nothing;
    v_sort := v_sort + 10;
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, 'хэрэглэгч'), '@', 1)
  );

  insert into public.profiles (id, display_name, currency, locale, theme)
  values (new.id, v_display_name, 'MNT', 'mn', 'dark')
  on conflict (id) do nothing;

  insert into public.wallets (user_id, name, type, currency, icon, color, sort_order)
  values (new.id, 'Бэлэн мөнгө', 'cash', 'MNT', 'wallet', '#2563eb', 0);

  perform public.seed_default_categories(new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 10. Indexes
-- ---------------------------------------------------------------------------
create index wallets_user_idx              on public.wallets (user_id, sort_order);
create index wallets_user_active_idx       on public.wallets (user_id) where not is_archived;

create index categories_user_idx           on public.categories (user_id, type, sort_order);
create index categories_parent_idx         on public.categories (parent_id) where parent_id is not null;

create index transactions_user_date_idx    on public.transactions (user_id, occurred_at desc);
create index transactions_user_wallet_idx  on public.transactions (user_id, wallet_id);
create index transactions_user_category_idx on public.transactions (user_id, category_id);
create index transactions_user_type_idx    on public.transactions (user_id, type);
create index transactions_to_wallet_idx    on public.transactions (to_wallet_id) where to_wallet_id is not null;
create index transactions_tags_idx         on public.transactions using gin (tags);

create index budgets_user_month_idx        on public.budgets (user_id, month);

create index goals_user_idx                on public.savings_goals (user_id);
create index goal_contributions_goal_idx   on public.goal_contributions (user_id, goal_id, contributed_at desc);

create index debts_user_status_idx         on public.debts (user_id, status);
create index debt_payments_debt_idx        on public.debt_payments (user_id, debt_id, paid_at desc);

create index loans_user_idx                on public.loans (user_id);

create index snapshots_user_date_idx       on public.net_worth_snapshots (user_id, date desc);

create index recurring_rules_next_run_idx  on public.recurring_rules (user_id, next_run) where is_active;

-- ---------------------------------------------------------------------------
-- 11. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.wallets             enable row level security;
alter table public.categories          enable row level security;
alter table public.recurring_rules     enable row level security;
alter table public.transactions        enable row level security;
alter table public.budgets             enable row level security;
alter table public.savings_goals       enable row level security;
alter table public.goal_contributions  enable row level security;
alter table public.debts               enable row level security;
alter table public.debt_payments       enable row level security;
alter table public.loans               enable row level security;
alter table public.net_worth_snapshots enable row level security;

-- profiles: row id equals the auth user id.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using ((select auth.uid()) = id);

-- Every other table: user_id must match the session user for all operations.
create policy "wallets_all_own" on public.wallets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "categories_all_own" on public.categories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "recurring_rules_all_own" on public.recurring_rules
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "transactions_all_own" on public.transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "budgets_all_own" on public.budgets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "savings_goals_all_own" on public.savings_goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "goal_contributions_all_own" on public.goal_contributions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "debts_all_own" on public.debts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "debt_payments_all_own" on public.debt_payments
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "loans_all_own" on public.loans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "net_worth_snapshots_all_own" on public.net_worth_snapshots
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 12. Grants
--    RLS is the gate, but PostgREST still needs table privileges.
--    anon gets nothing: the app has no public data.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

revoke all on all tables in schema public from anon;
revoke all on public.wallet_balances from anon;
revoke all on public.debt_balances from anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.wallet_balances to authenticated;
grant select on public.debt_balances to authenticated;

-- RPCs
grant execute on function public.capture_net_worth_snapshot(date) to authenticated;
grant execute on function public.calculate_net_worth(uuid, date) to authenticated;

-- Internal helpers run as SECURITY DEFINER and must never be callable by
-- end users: PUBLIC has EXECUTE by default, so revoke it explicitly.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.seed_default_categories(uuid) from public, anon, authenticated;
revoke all on function public.validate_transaction() from public, anon, authenticated;
revoke all on function public.sync_goal_amount() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.seed_default_categories(uuid) to service_role;
