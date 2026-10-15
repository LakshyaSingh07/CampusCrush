-- Push notifications for new matches and messages, sent from the database
-- to the Expo push service via pg_net (no extra server needed).

create extension if not exists pg_net;

create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  platform text,
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

-- No client policies: tokens are managed through the functions below
alter table public.push_tokens enable row level security;

-- A device token belongs to whoever is signed in on that device, so
-- re-registering moves it to the current user.
create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  insert into public.push_tokens (token, user_id, platform)
  values (p_token, auth.uid(), p_platform)
  on conflict (token)
  do update set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

create or replace function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens
  where token = p_token and user_id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Sending
-- ---------------------------------------------------------------------------
create or replace function public.send_push(p_user_id uuid, p_title text, p_body text, p_data jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_messages jsonb;
begin
  select jsonb_agg(jsonb_build_object(
    'to', t.token,
    'title', p_title,
    'body', p_body,
    'data', p_data,
    'sound', 'default',
    'channelId', 'default'
  ))
  into v_messages
  from public.push_tokens t
  where t.user_id = p_user_id;

  if v_messages is null then
    return;
  end if;

  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := v_messages,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
exception when others then
  -- A notification failure must never block the match/message insert
  raise warning 'send_push failed: %', sqlerrm;
end;
$$;

create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient uuid;
  v_sender_name text;
  v_sender_photo text;
begin
  select case when m.user_a = new.sender_id then m.user_b else m.user_a end
  into v_recipient
  from public.matches m
  where m.id = new.match_id;

  select split_part(p.full_name, ' ', 1), p.profile_image_urls[1]
  into v_sender_name, v_sender_photo
  from public.profiles p
  where p.user_id = new.sender_id;

  perform public.send_push(
    v_recipient,
    v_sender_name,
    left(new.body, 140),
    jsonb_build_object(
      'type', 'message',
      'match_id', new.match_id,
      'other_user_id', new.sender_id,
      'name', v_sender_name,
      'photo', v_sender_photo
    )
  );
  return new;
end;
$$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();

-- The person whose swipe created the match already sees the in-app
-- "It's a match!" screen, so only notify the other person.
create or replace function public.notify_new_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me uuid := auth.uid();
  v_pair record;
begin
  for v_pair in
    select new.user_a as recipient, new.user_b as other
    union all
    select new.user_b, new.user_a
  loop
    continue when v_pair.recipient = v_me;

    perform public.send_push(
      v_pair.recipient,
      'New match!',
      (select 'You and ' || split_part(p.full_name, ' ', 1) || ' like each other. Say hi!'
         from public.profiles p where p.user_id = v_pair.other),
      jsonb_build_object(
        'type', 'match',
        'match_id', new.id,
        'other_user_id', v_pair.other,
        'name', (select split_part(p.full_name, ' ', 1) from public.profiles p where p.user_id = v_pair.other),
        'photo', (select p.profile_image_urls[1] from public.profiles p where p.user_id = v_pair.other)
      )
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists matches_notify on public.matches;
create trigger matches_notify
  after insert on public.matches
  for each row execute function public.notify_new_match();

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
revoke execute on function public.register_push_token(text, text) from public, anon;
revoke execute on function public.unregister_push_token(text) from public, anon;
revoke execute on function public.send_push(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.register_push_token(text, text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;
