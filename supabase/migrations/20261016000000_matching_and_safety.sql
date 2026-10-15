-- Discovery, swipes, matches, blocks and reports.
-- Other users' profiles are never read directly from `profiles` (its RLS only
-- allows reading your own row). They are exposed through the security definer
-- functions below, which return age instead of birthday and never return email.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.swipes (
  swiper_id uuid not null references public.profiles (user_id) on delete cascade,
  swipee_id uuid not null references public.profiles (user_id) on delete cascade,
  direction text not null check (direction in ('like', 'pass')),
  created_at timestamptz not null default now(),
  primary key (swiper_id, swipee_id),
  check (swiper_id <> swipee_id)
);

create index if not exists swipes_swipee_likes_idx
  on public.swipes (swipee_id) where direction = 'like';

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (user_id) on delete cascade,
  user_b uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unmatched_at timestamptz,
  unmatched_by uuid references public.profiles (user_id) on delete set null,
  last_message_at timestamptz,
  check (user_a < user_b),
  unique (user_a, user_b)
);

create index if not exists matches_user_b_idx on public.matches (user_b);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (user_id) on delete cascade,
  blocked_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles (user_id) on delete cascade,
  reported_id uuid not null references public.profiles (user_id) on delete cascade,
  reason text not null check (
    reason in ('fake_profile', 'inappropriate_photos', 'harassment', 'spam', 'underage', 'other')
  ),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

-- ---------------------------------------------------------------------------
-- RLS
-- swipes: no client policies; only written/read through the functions below.
-- matches: members can read their own matches.
-- blocks: users can see the blocks they created.
-- reports: users can file reports; nobody can read them from the client.
-- ---------------------------------------------------------------------------
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;

drop policy if exists "matches_select_member" on public.matches;
create policy "matches_select_member" on public.matches
  for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));

drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own" on public.blocks
  for select to authenticated
  using (blocker_id = (select auth.uid()));

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_blocked_between(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b)
       or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;

-- ---------------------------------------------------------------------------
-- Discovery feed
-- ---------------------------------------------------------------------------
create or replace function public.get_discovery_feed(p_limit int default 20)
returns table (
  user_id uuid,
  first_name text,
  age int,
  department text,
  grad_year int,
  gender text,
  height_cm int,
  bio text,
  photos text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.user_id,
    split_part(p.full_name, ' ', 1),
    extract(year from age(p.birthday))::int,
    p.department,
    p.grad_year,
    p.gender,
    p.height_cm,
    p.bio,
    p.profile_image_urls
  from public.profiles me
  join public.profiles p on p.user_id <> me.user_id
  where me.user_id = (select auth.uid())
    and p.onboarding_done
    and not p.is_paused
    and p.gender = any (me.interested_in)
    and me.gender = any (p.interested_in)
    and not exists (
      select 1 from public.swipes s
      where s.swiper_id = me.user_id and s.swipee_id = p.user_id
    )
    and not public.is_blocked_between(me.user_id, p.user_id)
  order by p.updated_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- ---------------------------------------------------------------------------
-- Swipe: records a like/pass and creates a match on a mutual like.
-- ---------------------------------------------------------------------------
create or replace function public.swipe(p_target uuid, p_direction text)
returns table (matched boolean, match_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_match_id uuid;
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if p_direction not in ('like', 'pass') then
    raise exception 'Invalid swipe direction';
  end if;
  if p_target = v_me then
    raise exception 'You cannot swipe on yourself';
  end if;
  if public.is_blocked_between(v_me, p_target) then
    raise exception 'This profile is no longer available';
  end if;

  -- Serialise swipes between the same two users so two simultaneous likes
  -- can't both miss each other and skip creating the match.
  perform pg_advisory_xact_lock(
    hashtextextended(least(v_me, p_target)::text || greatest(v_me, p_target)::text, 0)
  );

  insert into public.swipes (swiper_id, swipee_id, direction)
  values (v_me, p_target, p_direction)
  on conflict (swiper_id, swipee_id)
  do update set direction = excluded.direction, created_at = now();

  if p_direction = 'like' and exists (
    select 1 from public.swipes s
    where s.swiper_id = p_target and s.swipee_id = v_me and s.direction = 'like'
  ) then
    insert into public.matches (user_a, user_b)
    values (least(v_me, p_target), greatest(v_me, p_target))
    on conflict (user_a, user_b) do nothing
    returning id into v_match_id;

    if v_match_id is not null then
      return query select true, v_match_id;
      return;
    end if;
  end if;

  return query select false, null::uuid;
end;
$$;

-- ---------------------------------------------------------------------------
-- People who liked me that I haven't swiped on yet
-- ---------------------------------------------------------------------------
create or replace function public.get_liked_me()
returns table (
  user_id uuid,
  first_name text,
  age int,
  department text,
  grad_year int,
  gender text,
  height_cm int,
  bio text,
  photos text[],
  liked_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.user_id,
    split_part(p.full_name, ' ', 1),
    extract(year from age(p.birthday))::int,
    p.department,
    p.grad_year,
    p.gender,
    p.height_cm,
    p.bio,
    p.profile_image_urls,
    s.created_at
  from public.swipes s
  join public.profiles p on p.user_id = s.swiper_id
  where s.swipee_id = (select auth.uid())
    and s.direction = 'like'
    and p.onboarding_done
    and not p.is_paused
    and not exists (
      select 1 from public.swipes mine
      where mine.swiper_id = s.swipee_id and mine.swipee_id = s.swiper_id
    )
    and not public.is_blocked_between(s.swipee_id, s.swiper_id)
  order by s.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Unmatch / block
-- ---------------------------------------------------------------------------
create or replace function public.unmatch(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
begin
  update public.matches
  set unmatched_at = now(), unmatched_by = v_me
  where id = p_match_id
    and v_me in (user_a, user_b)
    and unmatched_at is null;
end;
$$;

create or replace function public.block_user(p_target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if p_target = v_me then
    raise exception 'You cannot block yourself';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (v_me, p_target)
  on conflict do nothing;

  update public.matches
  set unmatched_at = now(), unmatched_by = v_me
  where user_a = least(v_me, p_target)
    and user_b = greatest(v_me, p_target)
    and unmatched_at is null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions: functions are callable by signed-in users only
-- ---------------------------------------------------------------------------
revoke execute on function public.is_blocked_between(uuid, uuid) from public, anon;
revoke execute on function public.get_discovery_feed(int) from public, anon;
revoke execute on function public.swipe(uuid, text) from public, anon;
revoke execute on function public.get_liked_me() from public, anon;
revoke execute on function public.unmatch(uuid) from public, anon;
revoke execute on function public.block_user(uuid) from public, anon;

grant execute on function public.get_discovery_feed(int) to authenticated;
grant execute on function public.swipe(uuid, text) to authenticated;
grant execute on function public.get_liked_me() to authenticated;
grant execute on function public.unmatch(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
