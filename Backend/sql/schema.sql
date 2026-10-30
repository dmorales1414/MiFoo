-- MiFoo schema. Paste the WHOLE file into Supabase dashboard -> SQL Editor -> Run.
-- It is safe to run again at any time: it only adds what is missing and refreshes
-- the signup trigger, so you can re-run it after every update to this file.
--
-- Users live in Supabase Auth (auth.users); our tables only reference them.

-- ---------------------------------------------------------------------------
-- items: what is in the user's kitchen
-- ---------------------------------------------------------------------------
create table if not exists public.items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_name       text not null check (char_length(item_name) between 1 and 200),
  category        text not null check (category in ('packaged', 'produce')),
  expiration_date date,                       -- nullable: produce is tracked by storage time
  date_added      timestamptz not null default now(),
  quantity        integer not null default 1 check (quantity >= 1),
  constraint packaged_needs_expiration
    check (category <> 'packaged' or expiration_date is not null)
);
create index if not exists items_user_id_idx on public.items (user_id);

create table if not exists public.recipes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 200),
  description text,
  source_url  text
);

create table if not exists public.recipe_ingredients (
  id         uuid primary key default gen_random_uuid(),
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  item_id    uuid not null references public.items(id) on delete cascade,
  quantity   integer not null default 1 check (quantity >= 1)
);
create index if not exists recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id);

-- ---------------------------------------------------------------------------
-- profiles: PUBLIC info about a user (safe to show on a social page).
-- One row per auth user, created automatically at signup (trigger below).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- "Daniel" and "daniel" must not both exist (the plain UNIQUE above is case-sensitive).
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- ---------------------------------------------------------------------------
-- profile_private: the user's PRIVATE account details. Never shown to other
-- users, and the app cannot read it directly: only our backend can (secret key).
--   email: a copy of the login email, so the backend can find it from a username
--   phone, push_notifications_enabled: settings shown on the Profile screen
-- ---------------------------------------------------------------------------
create table if not exists public.profile_private (
  id                          uuid primary key references auth.users(id) on delete cascade,
  email                       text,
  phone                       text check (phone is null or char_length(phone) between 7 and 20),
  push_notifications_enabled  boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Row Level Security: on for every table, so the publishable key can never read
-- anyone's data by itself.
-- ---------------------------------------------------------------------------
alter table public.items              enable row level security;
alter table public.recipes            enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.profiles           enable row level security;
alter table public.profile_private    enable row level security;  -- and NO policies: backend only

-- profiles: any signed-in user may read profiles (social page); users edit only their own.
drop policy if exists "profiles readable by signed-in users" on public.profiles;
create policy "profiles readable by signed-in users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Table privileges. The backend's secret key uses the service_role Postgres role:
-- it skips RLS but still needs privileges.
grant all on public.items, public.recipes, public.recipe_ingredients,
             public.profiles, public.profile_private to service_role;
grant select, update on public.profiles to authenticated;
revoke all on public.profile_private from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Signup trigger: when a user is created, build their profile rows.
-- The backend passes username and display_name as signup metadata.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    nullif(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;

  insert into public.profile_private (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the email copy in step if a user's login email ever changes.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profile_private set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Backfill: rows for accounts that already exist (for example one made by hand in the dashboard).
insert into public.profiles (id) select id from auth.users on conflict do nothing;
insert into public.profile_private (id, email)
  select id, email from auth.users on conflict do nothing;
