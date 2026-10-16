-- The project started with an early draft of swipes / matches / messeges
-- (bigint ids referencing profiles.id). The app uses the schema in the later
-- migrations instead, so drop the draft tables, but only while they still have
-- the draft shape and contain no data.

do $$
begin
  if to_regclass('public.messeges') is not null then
    if exists (select 1 from public.messeges) then
      raise exception 'public.messeges has data; migrate it manually before applying this migration';
    end if;
    drop table public.messeges;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user1_id'
  ) then
    if exists (select 1 from public.matches) then
      raise exception 'Draft public.matches has data; migrate it manually before applying this migration';
    end if;
    drop table public.matches;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'swipes' and column_name = 'swiped_id'
  ) then
    if exists (select 1 from public.swipes) then
      raise exception 'Draft public.swipes has data; migrate it manually before applying this migration';
    end if;
    drop table public.swipes;
  end if;
end $$;

-- Replaced by the profiles_*_own policies in the baseline migration
drop policy if exists "Enable update for own user" on public.profiles;
drop policy if exists "Enable read access for own user" on public.profiles;
