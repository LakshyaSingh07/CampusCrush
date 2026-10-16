-- Password login (set once after the first email-code sign-in) and the
-- verified badge. Both columns already exist on the live project.

alter table public.profiles
  add column if not exists has_password boolean not null default false,
  add column if not exists is_verified boolean not null default false;

-- Users can update their own row, but never their ban or verified status
create or replace function public.protect_moderation_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.banned_at is distinct from old.banned_at
          or new.ban_reason is distinct from old.ban_reason
          or new.is_verified is distinct from old.is_verified) then
    raise exception 'Moderation fields can only be changed by an admin';
  end if;
  return new;
end;
$$;

-- Same as before, plus is_verified for the blue tick
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
    'prompts', p.prompt_answers,
    'is_verified', p.is_verified
  );
$$;

revoke execute on function public.profile_card(public.profiles) from public, anon, authenticated;
