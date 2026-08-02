-- Fix: INSERT ... RETURNING on spaces failed RLS because the creator's owner
-- membership is added by an AFTER trigger — too late for the SELECT policy
-- that RETURNING must satisfy. Creators can always see their own live spaces.

drop policy "spaces: members read live" on public.spaces;

create policy "spaces: members read live" on public.spaces
  for select using (
    (public.is_space_member(id) or created_by = auth.uid())
    and deleted_at is null
  );
