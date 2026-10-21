-- MiFoo schema. Paste into Supabase dashboard -> SQL Editor -> Run.
-- Users live in Supabase Auth (auth.users); we only reference them.

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

-- Row Level Security: on, so the publishable key can never read anyone's data.
alter table public.items              enable row level security;
alter table public.recipes            enable row level security;
alter table public.recipe_ingredients enable row level security;

-- The backend's secret key uses the service_role Postgres role. It skips RLS
-- but still needs table privileges:
grant all on public.items, public.recipes, public.recipe_ingredients to service_role;

-- ---------------------------------------------------------------------------
-- profiles: public-facing info about a user (for the social page and general
-- display in the app). One row per auth user. Email and password stay in
-- auth.users and are NEVER copied here, so the table is safe to show to others.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any logged-in user may read profiles (needed for a social page);
-- a user may only change their own.
drop policy if exists "profiles readable by signed-in users" on public.profiles;
create policy "profiles readable by signed-in users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

grant all on public.profiles to service_role;
grant select, update on public.profiles to authenticated;

-- Automatically create an empty profile whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: profiles for any accounts that already exist.
insert into public.profiles (id) select id from auth.users on conflict do nothing;
