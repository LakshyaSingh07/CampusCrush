-- Counts for the Chats tab badge, returned with the other per-user numbers.

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
    'liked_me_count', (select count(*)::int from public.liked_me_profiles(me)),
    -- Unread messages from the other person in my active matches
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
    -- Active matches nobody has messaged yet
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

revoke execute on function public.get_my_entitlements() from public, anon;
grant execute on function public.get_my_entitlements() to authenticated;

-- Stream new matches too (Realtime applies the matches select policy), so the
-- badge updates when the other person likes back
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
     ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;
