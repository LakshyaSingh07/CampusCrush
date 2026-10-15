-- Terms acceptance, bans, auto-hiding heavily reported users, rate limits,
-- and an admin view of reports for the Supabase dashboard.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists accepted_terms_at timestamptz,
  add column if not exists banned_at timestamptz,
  add column if not exists ban_reason text;

-- Onboarding now also requires accepting the guidelines and privacy policy.
-- Mirrors getNextOnboardingRoute() in src/lib/onboarding.js. Keep in sync.
-- (Functions that read this column are plain SQL/plpgsql, so dropping and
-- re-adding it doesn't break them.)
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
  ) stored;

-- Users can update their own row, but never their ban status
create or replace function public.protect_moderation_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.banned_at is distinct from old.banned_at
          or new.ban_reason is distinct from old.ban_reason) then
    raise exception 'Moderation fields can only be changed by an admin';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_moderation on public.profiles;
create trigger profiles_protect_moderation
  before update on public.profiles
  for each row execute function public.protect_moderation_columns();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_banned(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select banned_at is not null from public.profiles where user_id = p_user), false);
$$;

-- No-argument version for RLS policies, so clients can't probe other users
create or replace function public.am_i_banned()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_banned((select auth.uid()));
$$;

-- Hidden from discovery while 3+ different people have open reports against
-- them, until an admin reviews the reports.
create or replace function public.is_under_review(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (
    select count(distinct r.reporter_id) from public.reports r
    where r.reported_id = p_user and r.status = 'open'
  ) >= 3;
$$;

create index if not exists reports_reported_open_idx
  on public.reports (reported_id) where status = 'open';

-- ---------------------------------------------------------------------------
-- Discovery / likes / matches now skip banned and under-review users
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
    and p.banned_at is null
    and not exists (
      select 1 from public.swipes mine
      where mine.swiper_id = s.swipee_id and mine.swipee_id = s.swiper_id
    )
    and not public.is_blocked_between(s.swipee_id, s.swiper_id)
    and not public.is_under_review(p.user_id)
  order by s.created_at desc;
$$;

create or replace function public.get_my_matches()
returns table (
  match_id uuid,
  matched_at timestamptz,
  other_user_id uuid,
  first_name text,
  age int,
  department text,
  grad_year int,
  gender text,
  height_cm int,
  bio text,
  photos text[],
  last_message text,
  last_message_at timestamptz,
  last_message_sender uuid,
  unread_count int
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id,
    m.created_at,
    p.user_id,
    split_part(p.full_name, ' ', 1),
    extract(year from age(p.birthday))::int,
    p.department,
    p.grad_year,
    p.gender,
    p.height_cm,
    p.bio,
    p.profile_image_urls,
    lm.body,
    lm.created_at,
    lm.sender_id,
    (
      select count(*)::int from public.messages x
      where x.match_id = m.id
        and x.sender_id <> (select auth.uid())
        and x.read_at is null
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
    and m.unmatched_at is null
    and p.banned_at is null
  order by coalesce(lm.created_at, m.created_at) desc;
$$;

-- ---------------------------------------------------------------------------
-- Swipe: adds ban check and a daily limit
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
  if public.is_banned(v_me) then
    raise exception 'Your account has been suspended';
  end if;
  if public.is_blocked_between(v_me, p_target) or public.is_banned(p_target) then
    raise exception 'This profile is no longer available';
  end if;
  if (
    select count(*) from public.swipes
    where swiper_id = v_me and created_at > now() - interval '1 day'
  ) >= 1000 then
    raise exception 'Daily swipe limit reached. Try again tomorrow.';
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
-- Messages: banned users can't send; max 20 messages per minute
-- ---------------------------------------------------------------------------
drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_match_member(match_id, true)
    and not public.am_i_banned()
  );

create or replace function public.limit_message_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.messages
    where sender_id = new.sender_id and created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'You''re sending messages too quickly. Please wait a moment.';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.limit_message_rate();

create index if not exists messages_sender_created_idx
  on public.messages (sender_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Admin view of reports (dashboard / service role only)
-- To act on a report: update reports.status, and to ban someone set
-- profiles.banned_at = now() and profiles.ban_reason.
-- ---------------------------------------------------------------------------
create or replace view public.admin_reports
with (security_invoker = true)
as
select
  r.id as report_id,
  r.created_at,
  r.status,
  r.reason,
  r.details,
  r.reporter_id,
  reporter.full_name as reporter_name,
  r.reported_id,
  reported.full_name as reported_name,
  reported_user.email as reported_email,
  reported.banned_at as reported_banned_at,
  (
    select count(distinct r2.reporter_id) from public.reports r2
    where r2.reported_id = r.reported_id
  ) as total_reporters
from public.reports r
left join public.profiles reporter on reporter.user_id = r.reporter_id
left join public.profiles reported on reported.user_id = r.reported_id
left join auth.users reported_user on reported_user.id = r.reported_id
order by r.status = 'open' desc, r.created_at desc;

revoke all on public.admin_reports from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
revoke execute on function public.is_banned(uuid) from public, anon, authenticated;
revoke execute on function public.is_under_review(uuid) from public, anon, authenticated;
revoke execute on function public.am_i_banned() from public, anon;
-- Used inside the messages insert policy, so signed-in users need it
grant execute on function public.am_i_banned() to authenticated;
