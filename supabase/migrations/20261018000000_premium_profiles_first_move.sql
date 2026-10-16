-- Richer profiles (goal, interests, lifestyle, prompts), Premium
-- entitlements and limits, undo, and Bumble-style "women make the first move"
-- with 24-hour match expiry.

-- ===========================================================================
-- Profiles
-- ===========================================================================
-- interests, relationship_goal, drinker_status, smoker_status, religion and
-- hometown already exist on the live project; add if missing elsewhere.
alter table public.profiles
  add column if not exists relationship_goal text,
  add column if not exists interests text[],
  add column if not exists drinker_status text,
  add column if not exists smoker_status text,
  add column if not exists exercise_status text,
  add column if not exists religion text,
  add column if not exists hometown text,
  add column if not exists prompt_answers jsonb not null default '[]',
  add column if not exists lifestyle_answered boolean not null default false;

alter table public.profiles alter column interests set default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_goal_valid') then
    alter table public.profiles add constraint profiles_goal_valid check (
      relationship_goal is null
      or relationship_goal in ('relationship', 'casual', 'friends', 'not_sure')
    ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_interests_max_5') then
    alter table public.profiles add constraint profiles_interests_max_5
      check (cardinality(coalesce(interests, '{}')) <= 5) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_prompts_valid') then
    alter table public.profiles add constraint profiles_prompts_valid check (
      jsonb_typeof(prompt_answers) = 'array'
      and jsonb_array_length(prompt_answers) <= 3
      and char_length(prompt_answers::text) <= 2000
    ) not valid;
  end if;
end $$;

-- Mirrors getNextOnboardingRoute() in src/lib/onboarding.js. Keep in sync.
alter table public.profiles drop column if exists onboarding_done;
alter table public.profiles
  add column onboarding_done boolean generated always as (
    accepted_terms_at is not null
    and full_name is not null
    and birthday is not null
    and department is not null
    and grad_year is not null
    and gender is not null
    and cardinality(interested_in) > 0
    and height_cm is not null
    and cardinality(profile_image_urls) >= 3
    and relationship_goal is not null
    and cardinality(coalesce(interests, '{}')) >= 3
    and lifestyle_answered
    and jsonb_array_length(prompt_answers) >= 1
  ) stored;

-- What other users see. Never includes email, exact birthday or moderation data.
create or replace function public.profile_card(p public.profiles)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'user_id', p.user_id,
    'first_name', split_part(p.full_name, ' ', 1),
    'age', extract(year from age(p.birthday))::int,
    'department', p.department,
    'grad_year', p.grad_year,
    'gender', p.gender,
    'height_cm', p.height_cm,
    'bio', p.bio,
    'photos', coalesce(p.profile_image_urls, '{}'),
    'relationship_goal', p.relationship_goal,
    'interests', coalesce(p.interests, '{}'),
    'drinking', p.drinker_status,
    'smoking', p.smoker_status,
    'exercise', p.exercise_status,
    'religion', p.religion,
    'hometown', p.hometown,
    'prompts', p.prompt_answers
  );
$$;

-- ===========================================================================
-- Premium
-- ===========================================================================
create table if not exists public.subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  plan text not null check (plan in ('day', 'week', 'month')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  source text not null default 'manual'
    check (source in ('manual', 'razorpay', 'google_play', 'app_store', 'revenuecat')),
  external_id text unique,
  created_at timestamptz not null default now(),
  check (expires_at > starts_at)
);

create index if not exists subscriptions_user_expiry_idx
  on public.subscriptions (user_id, expires_at desc);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.premium_until(p_user uuid)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select max(expires_at) from public.subscriptions
  where user_id = p_user and starts_at <= now() and expires_at > now();
$$;

create or replace function public.is_premium(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.premium_until(p_user) is not null;
$$;

-- For testing / support from the dashboard (service role only):
--   select public.grant_premium('someone@galgotiasuniversity.ac.in', 'week');
-- Extends from the current expiry if the user already has Premium.
create or replace function public.grant_premium(p_email text, p_plan text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_start timestamptz;
  v_expires timestamptz;
begin
  select id into v_user from auth.users where lower(email) = lower(p_email);
  if v_user is null then
    raise exception 'No user with email %', p_email;
  end if;
  v_start := coalesce(public.premium_until(v_user), now());
  v_expires := v_start + case p_plan
    when 'day' then interval '1 day'
    when 'week' then interval '7 days'
    when 'month' then interval '30 days'
  end;
  insert into public.subscriptions (user_id, plan, starts_at, expires_at, source)
  values (v_user, p_plan, v_start, v_expires, 'manual');
  return v_expires;
end;
$$;

-- ===========================================================================
-- Matches: first move + expiry
-- ===========================================================================
alter table public.matches
  add column if not exists first_mover uuid references public.profiles (user_id) on delete set null,
  add column if not exists expires_at timestamptz,
  add column if not exists first_message_at timestamptz,
  add column if not exists first_sender uuid;

-- Woman + man: the woman sends the first message. Any other pairing: either
-- person can. Either way the first message must be sent within 24 hours.
create or replace function public.set_match_first_move()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gender_a text;
  v_gender_b text;
begin
  select gender into v_gender_a from public.profiles where user_id = new.user_a;
  select gender into v_gender_b from public.profiles where user_id = new.user_b;

  if v_gender_a = 'Woman' and v_gender_b = 'Man' then
    new.first_mover := new.user_a;
  elsif v_gender_a = 'Man' and v_gender_b = 'Woman' then
    new.first_mover := new.user_b;
  end if;

  new.expires_at := coalesce(new.expires_at, now() + interval '24 hours');
  return new;
end;
$$;

drop trigger if exists matches_first_move on public.matches;
create trigger matches_first_move
  before insert on public.matches
  for each row execute function public.set_match_first_move();

-- After the first message the other person has 24 hours to reply; once they
-- do, the match no longer expires.
create or replace function public.touch_match_last_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.matches
  set
    last_message_at = new.created_at,
    first_message_at = coalesce(first_message_at, new.created_at),
    first_sender = coalesce(first_sender, new.sender_id),
    expires_at = case
      when first_message_at is null then new.created_at + interval '24 hours'
      when expires_at is not null and new.sender_id <> first_sender then null
      else expires_at
    end
  where id = new.match_id;
  return new;
end;
$$;

create or replace function public.is_match_active(m public.matches)
returns boolean
language sql
stable
set search_path = ''
as $$
  select m.unmatched_at is null and (m.expires_at is null or m.expires_at > now());
$$;

create or replace function public.active_match_count(p_user uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.matches m
  join public.profiles other
    on other.user_id = case when m.user_a = p_user then m.user_b else m.user_a end
  where p_user in (m.user_a, m.user_b)
    and public.is_match_active(m)
    and other.banned_at is null;
$$;

create or replace function public.can_send_message(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match_id
      and (select auth.uid()) in (m.user_a, m.user_b)
      and public.is_match_active(m)
      and (m.first_message_at is not null or m.first_mover is null or m.first_mover = (select auth.uid()))
  );
$$;

drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.can_send_message(match_id)
    and not public.am_i_banned()
  );

-- ===========================================================================
-- Read functions now return profile_card JSON (more fields, one shape)
-- ===========================================================================
drop function if exists public.get_discovery_feed(int);
create function public.get_discovery_feed(p_limit int default 20)
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.profile_card(p)
  from public.profiles me
  join public.profiles p on p.user_id <> me.user_id
  where me.user_id = (select auth.uid())
    and me.banned_at is null
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
  order by p.updated_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- People who liked me that I haven't swiped on (shared by the count and list)
create or replace function public.liked_me_profiles(p_me uuid)
returns table (profile public.profiles, liked_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p, s.created_at
  from public.swipes s
  join public.profiles p on p.user_id = s.swiper_id
  where s.swipee_id = p_me
    and s.direction = 'like'
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

-- Premium only: who liked me. Free users get the count from get_my_entitlements().
drop function if exists public.get_liked_me();
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
    select public.profile_card(l.profile) || jsonb_build_object('liked_at', l.liked_at)
    from public.liked_me_profiles(auth.uid()) l
    order by l.liked_at desc;
end;
$$;

drop function if exists public.get_my_matches();
create function public.get_my_matches()
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.profile_card(p) || jsonb_build_object(
    'match_id', m.id,
    'matched_at', m.created_at,
    'other_user_id', p.user_id,
    'expires_at', m.expires_at,
    'first_mover', m.first_mover,
    'first_message_at', m.first_message_at,
    'first_sender', m.first_sender,
    'last_message', lm.body,
    'last_message_at', lm.created_at,
    'last_message_sender', lm.sender_id,
    'unread_count', (
      select count(*)::int from public.messages x
      where x.match_id = m.id
        and x.sender_id <> (select auth.uid())
        and x.read_at is null
    )
  )
  from public.matches m
  join public.profiles p
    on p.user_id = case when m.user_a = (select auth.uid()) then m.user_b else m.user_a end
  left join lateral (
    select msg.body, msg.created_at, msg.sender_id
    from public.messages msg
    where msg.match_id = m.id
    order by msg.created_at desc
    limit 1
  ) lm on true
  where (select auth.uid()) in (m.user_a, m.user_b)
    and public.is_match_active(m)
    and p.banned_at is null
  order by coalesce(lm.created_at, m.created_at) desc;
$$;

-- ===========================================================================
-- Entitlements and limits
-- ===========================================================================
-- Free: 20 swipes per day (India time) and 5 active matches.
create or replace function public.swipes_today(p_user uuid)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.swipes
  where swiper_id = p_user
    and created_at >= (date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata');
$$;

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
    'active_matches', public.active_match_count(me),
    'match_limit', case when public.is_premium(me) then null else 5 end,
    'liked_me_count', (select count(*)::int from public.liked_me_profiles(me))
  )
  from (select (select auth.uid()) as me) s;
$$;

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
  if p_direction not in ('like', 'pass') then
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
  if p_direction = 'like' and not v_premium and public.active_match_count(v_me) >= 5 then
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

-- Premium: bring back the last profile you swiped on (unless it became a match)
create or replace function public.undo_last_swipe()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_swipe public.swipes;
  v_profile public.profiles;
begin
  if not public.is_premium(v_me) then
    raise exception 'premium_required';
  end if;

  select * into v_swipe from public.swipes
  where swiper_id = v_me
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'nothing_to_undo';
  end if;
  if exists (
    select 1 from public.matches
    where user_a = least(v_me, v_swipe.swipee_id) and user_b = greatest(v_me, v_swipe.swipee_id)
  ) then
    raise exception 'cannot_undo_match';
  end if;

  delete from public.swipes
  where swiper_id = v_me and swipee_id = v_swipe.swipee_id;

  select * into v_profile from public.profiles where user_id = v_swipe.swipee_id;
  return public.profile_card(v_profile);
end;
$$;

-- ===========================================================================
-- Match notification text now reflects who makes the first move
-- ===========================================================================
create or replace function public.notify_new_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_pair record;
  v_other_name text;
  v_other_photo text;
  v_body text;
begin
  for v_pair in
    select new.user_a as recipient, new.user_b as other
    union all
    select new.user_b, new.user_a
  loop
    continue when v_pair.recipient = v_me;

    select split_part(p.full_name, ' ', 1), p.profile_image_urls[1]
    into v_other_name, v_other_photo
    from public.profiles p where p.user_id = v_pair.other;

    v_body := case
      when new.first_mover = v_pair.recipient then
        'You and ' || v_other_name || ' matched! You have 24 hours to make the first move.'
      when new.first_mover = v_pair.other then
        'You and ' || v_other_name || ' matched! She has 24 hours to make the first move.'
      else
        'You and ' || v_other_name || ' like each other. Say hi within 24 hours!'
    end;

    perform public.send_push(
      v_pair.recipient,
      'New match!',
      v_body,
      jsonb_build_object(
        'type', 'match',
        'match_id', new.id,
        'other_user_id', v_pair.other,
        'name', v_other_name,
        'photo', v_other_photo
      )
    );
  end loop;
  return new;
end;
$$;

-- ===========================================================================
-- Permissions
-- ===========================================================================
revoke execute on function public.profile_card(public.profiles) from public, anon, authenticated;
revoke execute on function public.premium_until(uuid) from public, anon, authenticated;
revoke execute on function public.is_premium(uuid) from public, anon, authenticated;
revoke execute on function public.grant_premium(text, text) from public, anon, authenticated;
revoke execute on function public.is_match_active(public.matches) from public, anon, authenticated;
revoke execute on function public.active_match_count(uuid) from public, anon, authenticated;
revoke execute on function public.liked_me_profiles(uuid) from public, anon, authenticated;
revoke execute on function public.swipes_today(uuid) from public, anon, authenticated;
revoke execute on function public.can_send_message(uuid) from public, anon;
revoke execute on function public.get_discovery_feed(int) from public, anon;
revoke execute on function public.get_liked_me() from public, anon;
revoke execute on function public.get_my_matches() from public, anon;
revoke execute on function public.get_my_entitlements() from public, anon;
revoke execute on function public.undo_last_swipe() from public, anon;

-- can_send_message is used inside the messages insert policy
grant execute on function public.can_send_message(uuid) to authenticated;
grant execute on function public.get_discovery_feed(int) to authenticated;
grant execute on function public.get_liked_me() to authenticated;
grant execute on function public.get_my_matches() to authenticated;
grant execute on function public.get_my_entitlements() to authenticated;
grant execute on function public.undo_last_swipe() to authenticated;
