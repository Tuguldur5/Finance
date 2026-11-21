-- ---------------------------------------------------------------------------
-- Google-only auth
--
-- 1. profiles.avatar_url
-- 2. replace the signup trigger so Google metadata fills name + avatar
-- 3. idempotent backfill for auth.users that predate this trigger
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'Google profile picture URL from raw_user_meta_data.avatar_url.';

-- ---------------------------------------------------------------------------
-- Signup trigger
-- ---------------------------------------------------------------------------
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

  return new;
exception
  when others then
    -- A profile/seed failure must never roll back the auth signup.
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- One-time backfill for existing users without a profile
-- ---------------------------------------------------------------------------
do $$
declare
  u record;
  v_display_name text;
  v_avatar_url   text;
begin
  for u in
    select id, email, raw_user_meta_data
    from auth.users
  loop
    v_display_name := coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      split_part(coalesce(u.email, 'хэрэглэгч'), '@', 1)
    );
    v_avatar_url := nullif(trim(u.raw_user_meta_data ->> 'avatar_url'), '');

    insert into public.profiles (
      id, display_name, avatar_url, currency, locale, theme
    )
    values (u.id, v_display_name, v_avatar_url, 'MNT', 'mn', 'dark')
    on conflict (id) do nothing;

    if not exists (
      select 1
      from public.wallets
      where user_id = u.id and name = 'Бэлэн мөнгө'
    ) then
      insert into public.wallets (
        user_id, name, type, currency, icon, color, sort_order
      )
      values (u.id, 'Бэлэн мөнгө', 'cash', 'MNT', 'wallet', '#2563eb', 0);
    end if;

    perform public.seed_default_categories(u.id);
  end loop;
end;
$$;
