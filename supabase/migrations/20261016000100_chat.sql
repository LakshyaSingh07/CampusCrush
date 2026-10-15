-- 1:1 chat between matched users.

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_match_created_idx
  on public.messages (match_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_match_member(p_match_id uuid, p_active_only boolean default false)
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
      and (not p_active_only or m.unmatched_at is null)
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS: members can read the conversation; only members of an active match
-- can send, and only as themselves. No client updates/deletes; read receipts
-- go through mark_match_read().
-- ---------------------------------------------------------------------------
alter table public.messages enable row level security;

drop policy if exists "messages_select_member" on public.messages;
create policy "messages_select_member" on public.messages
  for select to authenticated
  using (public.is_match_member(match_id));

drop policy if exists "messages_insert_member" on public.messages;
create policy "messages_insert_member" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_match_member(match_id, true)
  );

-- Keep matches.last_message_at current for sorting the chat list
create or replace function public.touch_match_last_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.matches
  set last_message_at = new.created_at
  where id = new.match_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_match on public.messages;
create trigger messages_touch_match
  after insert on public.messages
  for each row execute function public.touch_match_last_message();

-- ---------------------------------------------------------------------------
-- Read receipts
-- ---------------------------------------------------------------------------
create or replace function public.mark_match_read(p_match_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.messages
  set read_at = now()
  where match_id = p_match_id
    and sender_id <> (select auth.uid())
    and read_at is null
    and public.is_match_member(p_match_id);
$$;

-- ---------------------------------------------------------------------------
-- My active matches with the other person's public profile and last message
-- ---------------------------------------------------------------------------
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
  order by coalesce(lm.created_at, m.created_at) desc;
$$;

revoke execute on function public.is_match_member(uuid, boolean) from public, anon;
revoke execute on function public.mark_match_read(uuid) from public, anon;
revoke execute on function public.get_my_matches() from public, anon;
grant execute on function public.is_match_member(uuid, boolean) to authenticated;
grant execute on function public.mark_match_read(uuid) to authenticated;
grant execute on function public.get_my_matches() to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: stream new messages (Realtime applies the RLS select policy)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
     ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
