-- LIFE-23: app-invite notifications + invitee-facing invite listing.

-- When an invite is created for an email that already has an account,
-- raise an in-app notification for that user (foundations spec).
create or replace function public.notify_space_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invitee uuid;
  invite_space_name text;
  inviter_name text;
begin
  select id into invitee from auth.users
  where lower(email) = lower(new.email)
  limit 1;

  if invitee is null then
    return new; -- no account yet; the invite surfaces after they sign up
  end if;

  select name into invite_space_name from public.spaces where id = new.space_id;
  select display_name into inviter_name from public.profiles where id = new.invited_by;

  insert into public.notifications (user_id, type, payload)
  values (
    invitee,
    'space_invite',
    jsonb_build_object(
      'invite_id', new.id,
      'space_id', new.space_id,
      'space_name', invite_space_name,
      'role', new.role,
      'invited_by', inviter_name
    )
  );

  return new;
end;
$$;

create trigger space_invites_notify
  after insert on public.space_invites
  for each row execute function public.notify_space_invite();

-- Pending invites addressed to the signed-in user, enriched with space and
-- inviter names the invitee cannot read directly under RLS (not a member yet).
create or replace function public.my_pending_invites()
returns table (
  id uuid,
  space_id uuid,
  space_name text,
  space_color text,
  role text,
  invited_by_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select i.id, i.space_id, s.name, s.color, i.role, p.display_name, i.created_at
  from public.space_invites i
  join public.spaces s on s.id = i.space_id
  join public.profiles p on p.id = i.invited_by
  where lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and i.status = 'pending'
    and i.expires_at > now()
  order by i.created_at desc;
$$;
