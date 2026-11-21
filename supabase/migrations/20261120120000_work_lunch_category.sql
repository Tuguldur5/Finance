-- ---------------------------------------------------------------------------
-- Work-lunch expense category
--
-- Adds a dedicated expense category for eating lunch out during the workday.
-- The generic "Гадуур хооллолт" category stays available; this one is easier
-- to find and report separately.
-- ---------------------------------------------------------------------------

-- Backfill every existing profile. The category is nested under the generic
-- eating-out category when that category exists.
insert into public.categories (
  user_id, type, name, icon, color, parent_id, sort_order
)
select
  p.id,
  'expense',
  'Ажлын үдийн хоол',
  'utensils',
  '#f97316',
  (
    select c.id
    from public.categories c
    where c.user_id = p.id
      and c.type = 'expense'
      and c.name = 'Гадуур хооллолт'
    limit 1
  ),
  15
from public.profiles p
on conflict (user_id, type, name) do nothing;

-- Keep new signups in sync with the same category.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_avatar_url   text;
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(new.email, 'хэрэглэгч'), '@', 1)
  );

  v_avatar_url := nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '');

  insert into public.profiles (id, display_name, avatar_url, currency, locale, theme)
  values (new.id, v_display_name, v_avatar_url, 'MNT', 'mn', 'dark')
  on conflict (id) do nothing;

  insert into public.wallets (
    user_id, name, type, currency, icon, color, sort_order
  )
  select new.id, 'Бэлэн мөнгө', 'cash', 'MNT', 'wallet', '#2563eb', 0
  where not exists (
    select 1
    from public.wallets
    where user_id = new.id and name = 'Бэлэн мөнгө'
  );

  perform public.seed_default_categories(new.id);

  insert into public.categories (
    user_id, type, name, icon, color, parent_id, sort_order
  )
  values (
    new.id,
    'expense',
    'Ажлын үдийн хоол',
    'utensils',
    '#f97316',
    (
      select c.id
      from public.categories c
      where c.user_id = new.id
        and c.type = 'expense'
        and c.name = 'Гадуур хооллолт'
      limit 1
    ),
    15
  )
  on conflict (user_id, type, name) do nothing;

  return new;
exception
  when others then
    -- A profile/seed failure must never roll back the auth signup.
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;
