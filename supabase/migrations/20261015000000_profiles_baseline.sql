-- Baseline for the profiles table, the new-user trigger and RLS.
-- Written to be idempotent so it can run against a project where `profiles`
-- was originally created by hand in the Supabase dashboard.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists birthday date,
  add column if not exists department text,
  add column if not exists grad_year int,
  add column if not exists gender text,
  add column if not exists interested_in text[] not null default '{}',
  add column if not exists height_cm int,
  add column if not exists profile_image_urls text[] not null default '{}',
  add column if not exists bio text,
  add column if not exists is_paused boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Mirrors getNextOnboardingRoute() in src/lib/onboarding.js. Keep the two in sync.
alter table public.profiles
  add column if not exists onboarding_done boolean generated always as (
    full_name is not null
    and birthday is not null
    and department is not null
    and grad_year is not null
    and gender is not null
    and cardinality(interested_in) > 0
    and height_cm is not null
    and cardinality(profile_image_urls) >= 3
  ) stored;

-- ---------------------------------------------------------------------------
-- Constraints (NOT VALID so pre-existing rows don't block the migration;
-- they are still enforced for every new insert/update)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_min_age_18') then
    alter table public.profiles
      add constraint profiles_min_age_18
      check (birthday is null or birthday <= (current_date - interval '18 years'))
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_gender_valid') then
    alter table public.profiles
      add constraint profiles_gender_valid
      check (gender is null or gender in ('Woman', 'Man', 'Nonbinary'))
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_interested_in_valid') then
    alter table public.profiles
      add constraint profiles_interested_in_valid
      check (interested_in <@ array['Woman', 'Man', 'Nonbinary']::text[])
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_height_range') then
    alter table public.profiles
      add constraint profiles_height_range
      check (height_cm is null or height_cm between 120 and 230)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_photos_max_6') then
    alter table public.profiles
      add constraint profiles_photos_max_6
      check (cardinality(profile_image_urls) <= 6)
      not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_bio_length') then
    alter table public.profiles
      add constraint profiles_bio_length
      check (bio is null or char_length(bio) <= 500)
      not valid;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New-user trigger: enforce the university email domain on the server and
-- create the empty profile row the onboarding flow updates.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(split_part(new.email, '@', 2)) not in (
    'galgotiasuniversity.ac.in',
    'galgotiasuniversity.edu.in'
  ) then
    raise exception 'Only Galgotias University email addresses can sign up.';
  end if;

  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- Users can only read and write their own row for now. Reading other users'
-- profiles will go through a discovery RPC that hides birthday/email (M1).
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
