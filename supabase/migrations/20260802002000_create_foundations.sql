-- Foundations: profiles, spaces, membership, invites, notifications
-- Spec: docs/foundations.md · Standards: docs/data-standards.md

-- ------------------------------------------------------------------ helpers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------- profiles
-- User-scoped identity table (deliberate exception: no space_id, no soft delete)

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url   text,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------- spaces

create table public.spaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  kind       text not null default 'shared' check (kind in ('personal', 'shared')),
  color      text not null default '#8b5cf6',
  metadata   jsonb not null default '{}',
  created_by uuid not null references public.profiles (id) on delete cascade,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index spaces_one_personal_per_user
  on public.spaces (created_by) where kind = 'personal';

create trigger spaces_set_updated_at
  before update on public.spaces
  for each row execute function public.set_updated_at();

-- Cap + personal-space invariants. Service role (auth.uid() is null) bypasses
-- the owner check but never the personal-space rules.
create or replace function public.enforce_space_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  shared_space_cap constant int := 2; -- owned shared spaces per user (personal excluded)
begin
  if tg_op = 'INSERT' then
    if new.kind = 'shared' and (
      select count(*) from public.spaces
      where created_by = new.created_by and kind = 'shared' and deleted_at is null
    ) >= shared_space_cap then
      raise exception 'space limit reached: a user may own at most % shared spaces', shared_space_cap;
    end if;
    return new;
  end if;

  if old.kind = 'personal' and new.kind <> 'personal' then
    raise exception 'personal spaces cannot change kind';
  end if;

  if new.deleted_at is not null and old.deleted_at is null then
    if old.kind = 'personal' then
      raise exception 'personal spaces cannot be deleted';
    end if;
    if auth.uid() is not null and not exists (
      select 1 from public.space_members
      where space_id = old.id and user_id = auth.uid() and role = 'owner'
    ) then
      raise exception 'only the space owner can delete a space';
    end if;
    new.deleted_by = coalesce(new.deleted_by, auth.uid());
  end if;

  return new;
end;
$$;

create trigger spaces_enforce_rules
  before insert or update on public.spaces
  for each row execute function public.enforce_space_rules();

-- ------------------------------------------------------------ space_members

create table public.space_members (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.spaces (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'admin', 'member', 'guest')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, user_id)
);

create index space_members_user_id on public.space_members (user_id);

create trigger space_members_set_updated_at
  before update on public.space_members
  for each row execute function public.set_updated_at();

-- Space creators automatically become owners (covers user sign-up and
-- in-app creation; RLS would otherwise create a chicken-and-egg problem).
create or replace function public.add_space_creator_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.space_members (space_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (space_id, user_id) do nothing;
  return new;
end;
$$;

create trigger spaces_add_creator_membership
  after insert on public.spaces
  for each row execute function public.add_space_creator_membership();

-- ------------------------------------------------------------ space_invites

create table public.space_invites (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.spaces (id) on delete cascade,
  email      text not null,
  role       text not null default 'member' check (role in ('admin', 'member', 'guest')),
  status     text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  invited_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index space_invites_one_pending_per_email
  on public.space_invites (space_id, lower(email)) where status = 'pending';
create index space_invites_email on public.space_invites (lower(email));

create trigger space_invites_set_updated_at
  before update on public.space_invites
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------ notifications
-- User-scoped infrastructure (deliberate exception: no space_id, no soft delete)

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null,
  payload    jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created on public.notifications (user_id, created_at desc);

-- -------------------------------------------------------- sign-up bootstrap
-- Every new auth user gets a profile and a personal space (owner membership
-- comes from spaces_add_creator_membership).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_display_name text;
begin
  new_display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, display_name)
  values (new.id, new_display_name);

  insert into public.spaces (name, kind, created_by)
  values (new_display_name || '''s Space', 'personal', new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------- membership helpers
-- security definer so RLS policies can consult membership without recursion.

create or replace function public.is_space_member(target_space uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.space_members
    where space_id = target_space and user_id = auth.uid()
  );
$$;

create or replace function public.space_role(target_space uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.space_members
  where space_id = target_space and user_id = auth.uid();
$$;

create or replace function public.shares_space_with(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_members mine
    join public.space_members theirs on mine.space_id = theirs.space_id
    where mine.user_id = auth.uid() and theirs.user_id = other_user
  );
$$;

-- Accept an invite atomically: validates, adds membership, marks accepted.
create or replace function public.accept_space_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite record;
begin
  select * into invite from public.space_invites where id = invite_id for update;

  if invite is null then
    raise exception 'invite not found';
  end if;
  if invite.status <> 'pending' or invite.expires_at < now() then
    raise exception 'invite is no longer valid';
  end if;
  if lower(invite.email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'invite was sent to a different email address';
  end if;

  insert into public.space_members (space_id, user_id, role)
  values (invite.space_id, auth.uid(), invite.role)
  on conflict (space_id, user_id) do nothing;

  update public.space_invites set status = 'accepted' where id = invite_id;
end;
$$;

-- ---------------------------------------------------------------------- RLS

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.space_invites enable row level security;
alter table public.notifications enable row level security;

-- profiles: see yourself and anyone you share a space with
create policy "profiles: read own or space-mates" on public.profiles
  for select using (id = auth.uid() or public.shares_space_with(id));
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());

-- spaces: members read live rows; personal spaces are created only by trigger
create policy "spaces: members read live" on public.spaces
  for select using (public.is_space_member(id) and deleted_at is null);
create policy "spaces: create shared as self" on public.spaces
  for insert with check (created_by = auth.uid() and kind = 'shared');
create policy "spaces: owner or admin update" on public.spaces
  for update using (public.space_role(id) in ('owner', 'admin'));
-- no delete policy: hard deletes are system-only (space-delete cascade)

-- space_members: owners can never be removed (ownership transfer is phase 2)
create policy "space_members: members read" on public.space_members
  for select using (public.is_space_member(space_id));
create policy "space_members: admins add" on public.space_members
  for insert with check (public.space_role(space_id) in ('owner', 'admin'));
create policy "space_members: owner changes roles" on public.space_members
  for update using (public.space_role(space_id) = 'owner');
create policy "space_members: leave or remove non-owners" on public.space_members
  for delete using (
    role <> 'owner'
    and (
      user_id = auth.uid()
      or public.space_role(space_id) in ('owner', 'admin')
    )
  );

-- space_invites: admins manage; invitees see and respond to their own
create policy "space_invites: admins or invitee read" on public.space_invites
  for select using (
    public.space_role(space_id) in ('owner', 'admin')
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
create policy "space_invites: admins create" on public.space_invites
  for insert with check (
    public.space_role(space_id) in ('owner', 'admin') and invited_by = auth.uid()
  );
create policy "space_invites: admins or invitee update" on public.space_invites
  for update using (
    public.space_role(space_id) in ('owner', 'admin')
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- notifications: strictly personal
create policy "notifications: read own" on public.notifications
  for select using (user_id = auth.uid());
create policy "notifications: update own" on public.notifications
  for update using (user_id = auth.uid());
