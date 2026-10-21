-- Discovery filters and SuperSwipe.
--
-- Filters live in profiles.discovery_filters:
--   { age_min, age_max }                                   free
--   { departments[], grad_years[], goals[], verified_only } Premium only
-- Premium-only keys are ignored for free users, so the server is the gate.
--
-- SuperSwipe is a swipe with direction 'superlike': it counts as a like for
-- matching, puts you first in their feed with a banner, and sends them a push.
-- Free: 1 per day, Premium: 5 per day (India time).

-- ===========================================================================
-- Columns / constraints
-- ===========================================================================
alter table public.profiles
  add column if not exists discovery_filters jsonb not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_discovery_filters_object') then
    alter table public.profiles add constraint profiles_discovery_filters_object
      check (jsonb_typeof(discovery_filters) = 'object' and char_length(discovery_filters::text) <= 2000) not valid;
  end if;
end $$;

alter table public.swipes drop constraint if exists swipes_direction_check;
alter table public.swipes add constraint swipes_direction_check
  check (direction in ('like', 'pass', 'superlike'));

create index if not exists swipes_swipee_superlike_idx
  on public.swipes (swipee_id) where direction = 'superlike';

-- ===========================================================================
-- Limits
-- ===========================================================================
create or replace function public.superlike_limit(p_user uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.is_premium(p_user) then 5 else 1 end;
$$;

create or replace function public.superlikes_today(p_user uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.swipes
  where swiper_id = p_user
    and direction = 'superlike'
    and created_at >= (date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata');
$$;

-- ===========================================================================
-- Discovery feed: filters + SuperSwipers first
-- ===========================================================================
create or replace function public.get_discovery_feed(p_limit int default 20)
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select
      p.*,
      public.is_premium(p.user_id) as premium,
      coalesce((p.discovery_filters->>'age_min')::int, 18) as age_min,
      coalesce((p.discovery_filters->>'age_max')::int, 100) as age_max
    from public.profiles p
    where p.user_id = (select auth.uid())
  )
  select public.profile_card(p)
    || jsonb_build_object('superliked_me', sl.swiper_id is not null)
  from me
  join public.profiles p on p.user_id <> me.user_id
  left join public.swipes sl
    on sl.swiper_id = p.user_id and sl.swipee_id = me.user_id and sl.direction = 'superlike'
  where me.banned_at is null
    and p.onboarding_done
    and not p.is_paused
    and p.banned_at is null
    and p.gender = any (me.interested_in)
    and me.gender = any (p.interested_in)
    and not exists (
      select 1 from public.swipes s
      where s.swiper_id = me.user_id and s.swipee_id = p.user_id
    )
    and not public.is_blocked_between(me.user_id, p.user_id)
    and not public.is_under_review(p.user_id)
    -- Free filter: age range
    and extract(year from age(p.birthday)) between me.age_min and me.age_max
    -- Premium filters (ignored for free accounts)
    and (not me.premium or jsonb_array_length(coalesce(me.discovery_filters->'departments', '[]')) = 0
         or p.department in (select jsonb_array_elements_text(me.discovery_filters->'departments')))
    and (not me.premium or jsonb_array_length(coalesce(me.discovery_filters->'grad_years', '[]')) = 0
         or p.grad_year::text in (select jsonb_array_elements_text(me.discovery_filters->'grad_years')))
    and (not me.premium or jsonb_array_length(coalesce(me.discovery_filters->'goals', '[]')) = 0
         or p.relationship_goal in (select jsonb_array_elements_text(me.discovery_filters->'goals')))
    and (not me.premium or not coalesce((me.discovery_filters->>'verified_only')::boolean, false)
         or p.is_verified)
  order by (sl.swiper_id is not null) desc, p.updated_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- ===========================================================================
-- Liked me: SuperSwipes count as likes and are flagged
-- ===========================================================================
drop function if exists public.get_liked_me();
drop function if exists public.liked_me_profiles(uuid);

create function public.liked_me_profiles(p_me uuid)
returns table (profile public.profiles, liked_at timestamptz, superliked boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p, s.created_at, s.direction = 'superlike'
  from public.swipes s
  join public.profiles p on p.user_id = s.swiper_id
  where s.swipee_id = p_me
    and s.direction in ('like', 'superlike')
    and p.onboarding_done
    and not p.is_paused
    and p.banned_at is null
    and not exists (
      select 1 from public.swipes mine
      where mine.swiper_id = s.swipee_id and mine.swipee_id = s.swiper_id
    )
    and not public.is_blocked_between(s.swipee_id, s.swiper_id)
    and not public.is_under_review(p.user_id);
$$;

create function public.get_liked_me()
returns setof jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_premium(auth.uid()) then
    raise exception 'premium_required';
  end if;
  return query
    select public.profile_card(l.profile)
      || jsonb_build_object('liked_at', l.liked_at, 'superliked_me', l.superliked)
    from public.liked_me_profiles(auth.uid()) l
    order by l.superliked desc, l.liked_at desc;
end;
$$;

-- ===========================================================================
-- Swipe: accepts 'superlike'
-- ===========================================================================
create or replace function public.swipe(p_target uuid, p_direction text)
returns table (matched boolean, match_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_premium boolean;
  v_match_id uuid;
begin
  if v_me is null then
    raise exception 'Not authenticated';
  end if;
  if p_direction not in ('like', 'pass', 'superlike') then
    raise exception 'Invalid swipe direction';
  end if;
  if p_target = v_me then
    raise exception 'You cannot swipe on yourself';
  end if;
  if public.is_banned(v_me) then
    raise exception 'Your account has been suspended';
  end if;
  if public.is_blocked_between(v_me, p_target) or public.is_banned(p_target) then
    raise exception 'This profile is no longer available';
  end if;

  v_premium := public.is_premium(v_me);
  if not v_premium and public.swipes_today(v_me) >= 20 then
    raise exception 'swipe_limit_reached';
  end if;
  if v_premium and (
    select count(*) from public.swipes
    where swiper_id = v_me and created_at > now() - interval '1 day'
  ) >= 1000 then
    raise exception 'Daily swipe limit reached. Try again tomorrow.';
  end if;
  if p_direction = 'superlike' and public.superlikes_today(v_me) >= public.superlike_limit(v_me) then
    raise exception 'superlike_limit_reached';
  end if;
  if p_direction <> 'pass' and not v_premium and public.active_match_count(v_me) >= 5 then
    raise exception 'match_limit_reached';
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

  if p_direction <> 'pass' and exists (
    select 1 from public.swipes s
    where s.swiper_id = p_target and s.swipee_id = v_me and s.direction in ('like', 'superlike')
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

-- ===========================================================================
-- Entitlements: add SuperSwipe counts
-- ===========================================================================
create or replace function public.get_my_entitlements()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'is_premium', public.is_premium(me),
    'premium_until', public.premium_until(me),
    'premium_plan', (
      select plan from public.subscriptions
      where user_id = me and starts_at <= now() and expires_at > now()
      order by expires_at desc limit 1
    ),
    'daily_swipe_limit', case when public.is_premium(me) then null else 20 end,
    'swipes_today', public.swipes_today(me),
    'daily_superlike_limit', public.superlike_limit(me),
    'superlikes_today', public.superlikes_today(me),
    'active_matches', public.active_match_count(me),
    'match_limit', case when public.is_premium(me) then null else 5 end,
    'liked_me_count', (select count(*)::int from public.liked_me_profiles(me)),
    'unread_count', (
      select count(*)::int
      from public.messages msg
      join public.matches m on m.id = msg.match_id
      join public.profiles other on other.user_id = msg.sender_id
      where me in (m.user_a, m.user_b)
        and msg.sender_id <> me
        and msg.read_at is null
        and public.is_match_active(m)
        and other.banned_at is null
    ),
    'new_match_count', (
      select count(*)::int
      from public.matches m
      join public.profiles other
        on other.user_id = case when m.user_a = me then m.user_b else m.user_a end
      where me in (m.user_a, m.user_b)
        and m.first_message_at is null
        and public.is_match_active(m)
        and other.banned_at is null
    )
  )
  from (select (select auth.uid()) as me) s;
$$;

-- ===========================================================================
-- Push: tell people they were SuperSwiped (without naming who; they'll see
-- the banner on the profile in Discover)
-- ===========================================================================
create or replace function public.notify_superlike()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.direction = 'superlike' and (tg_op = 'INSERT' or old.direction is distinct from 'superlike') then
    perform public.send_push(
      new.swipee_id,
      'Someone SuperSwiped you ⭐',
      'They''re really interested. Find them first on Discover!',
      jsonb_build_object('type', 'superlike')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists swipes_notify_superlike on public.swipes;
create trigger swipes_notify_superlike
  after insert or update of direction on public.swipes
  for each row execute function public.notify_superlike();

-- ===========================================================================
-- Permissions
-- ===========================================================================
revoke execute on function public.superlike_limit(uuid) from public, anon, authenticated;
revoke execute on function public.superlikes_today(uuid) from public, anon, authenticated;
revoke execute on function public.liked_me_profiles(uuid) from public, anon, authenticated;
revoke execute on function public.get_liked_me() from public, anon;
grant execute on function public.get_liked_me() to authenticated;
revoke execute on function public.get_discovery_feed(int) from public, anon;
grant execute on function public.get_discovery_feed(int) to authenticated;
revoke execute on function public.get_my_entitlements() from public, anon;
grant execute on function public.get_my_entitlements() to authenticated;
