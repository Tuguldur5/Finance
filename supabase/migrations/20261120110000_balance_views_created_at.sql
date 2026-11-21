-- The list queries order by created_at, so the balance views must expose it.
-- Appending the column keeps CREATE OR REPLACE VIEW valid (existing columns
-- keep their names, types and order).

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
  ), 0)::numeric(18, 2) as balance,
  w.created_at
from public.wallets w
left join public.transactions t
  on t.user_id = w.user_id
 and (t.wallet_id = w.id or t.to_wallet_id = w.id)
group by w.id;

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
  (d.principal - coalesce(sum(p.amount), 0))::numeric(18, 2) as remaining_amount,
  d.created_at
from public.debts d
left join public.debt_payments p
  on p.debt_id = d.id and p.user_id = d.user_id
group by d.id;

grant select on public.wallet_balances to authenticated;
grant select on public.debt_balances to authenticated;
