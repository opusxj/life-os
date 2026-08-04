-- Three confirmed privilege bugs, all from the same mistake: an UPDATE policy
-- written with USING and no WITH CHECK. Postgres then reuses USING as the
-- check, which constrains WHO may touch a row but nothing about what they may
-- change it TO.
--
--   1. An invitee could `update space_invites set role='admin'` on their own
--      row before accepting, and accept_space_invite honoured it. Guest to
--      admin in one REST call.
--   2. A revoked or expired invite could be set back to pending with a fresh
--      expiry and then accepted.
--   3. A member could `update mortgages set space_id=<their own space>` and
--      move a row out of the shared space, or rewrite created_by in bulk.
--
-- WITH CHECK alone cannot fix 1 and 3: it only sees the new row, so it cannot
-- say "this column must not have changed". That needs BEFORE UPDATE triggers.

-- ---------------------------------------------------------------- ownership
-- Finance rows never move between spaces, and never change author.

create or replace function public.guard_row_ownership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.space_id is distinct from old.space_id then
    raise exception 'A record cannot be moved to another space.';
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'The author of a record cannot be changed.';
  end if;
  return new;
end;
$$;

do $$
declare
  target text;
begin
  foreach target in array array[
    'accounts', 'cards', 'categories', 'transactions',
    'budgets', 'saving_goals', 'recurring_payments', 'mortgages'
  ] loop
    execute format('drop trigger if exists %I_guard_ownership on public.%I', target, target);
    execute format(
      'create trigger %I_guard_ownership before update on public.%I
         for each row execute function public.guard_row_ownership()',
      target, target
    );
  end loop;
end $$;

-- ------------------------------------------------------------------ invites
-- Admins manage the invite. The invitee may only answer it: pending ->
-- accepted or declined, and nothing else about the row may move.

create or replace function public.guard_space_invite_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.space_id is distinct from old.space_id
     or new.email is distinct from old.email
     or new.invited_by is distinct from old.invited_by then
    raise exception 'An invite cannot be repointed.';
  end if;

  if public.space_role(old.space_id) in ('owner', 'admin') then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.expires_at is distinct from old.expires_at then
    raise exception 'Only a space admin can change an invite.';
  end if;

  if old.status <> 'pending' or new.status not in ('accepted', 'declined') then
    raise exception 'That invite is no longer open.';
  end if;

  return new;
end;
$$;

drop trigger if exists space_invites_guard_update on public.space_invites;
create trigger space_invites_guard_update
before update on public.space_invites
for each row execute function public.guard_space_invite_update();

-- ------------------------------------------------------------------ members
-- Ownership is not transferable through the role dropdown. Without this an
-- owner could demote themselves and permanently orphan the space — no owner
-- means nobody can ever change roles again, and (see below) spaces cannot be
-- deleted either.

create or replace function public.guard_space_member_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.space_id is distinct from old.space_id
     or new.user_id is distinct from old.user_id then
    raise exception 'A membership cannot be reassigned.';
  end if;
  if old.role = 'owner' or new.role = 'owner' then
    raise exception 'Ownership cannot be changed here.';
  end if;
  return new;
end;
$$;

drop trigger if exists space_members_guard_role on public.space_members;
create trigger space_members_guard_role
before update on public.space_members
for each row execute function public.guard_space_member_role();

drop policy if exists "space_members: owner changes roles" on public.space_members;
create policy "space_members: owner changes roles"
on public.space_members for update
using (space_role(space_id) = 'owner')
with check (space_role(space_id) = 'owner');

-- ------------------------------------------------------------------- spaces
-- LIFE-30. Every finance table was corrected to
-- `deleted_at is null or deleted_by = auth.uid()`; spaces was missed, so the
-- soft-delete UPDATE could never satisfy its own SELECT policy. Nothing
-- deletes a space today, but the shared-space cap counts only live rows — so
-- creating two by mistake was a permanent dead end.

drop policy if exists "spaces: members read live" on public.spaces;
create policy "spaces: members read live"
on public.spaces for select
using (
  (is_space_member(id) or created_by = auth.uid())
  and (deleted_at is null or deleted_by = auth.uid())
);

drop policy if exists "spaces: owner or admin update" on public.spaces;
create policy "spaces: owner or admin update"
on public.spaces for update
using (space_role(id) = any (array['owner', 'admin']))
with check (space_role(id) = any (array['owner', 'admin']));

-- --------------------------------------------------------------- rpc surface
-- Trigger-only functions were reachable at /rest/v1/rpc/… for any caller.
-- Postgres rejects them when invoked directly, but they have no business on
-- the public API surface.

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.add_space_creator_membership() from anon, authenticated;
revoke execute on function public.notify_space_invite() from anon, authenticated;
revoke execute on function public.apply_transaction_to_balances() from anon, authenticated;
revoke execute on function public.seed_space_categories() from anon, authenticated;
revoke execute on function public.seed_default_categories(uuid, uuid) from anon, authenticated;
revoke execute on function public.guard_row_ownership() from anon, authenticated;
revoke execute on function public.guard_space_invite_update() from anon, authenticated;
revoke execute on function public.guard_space_member_role() from anon, authenticated;
