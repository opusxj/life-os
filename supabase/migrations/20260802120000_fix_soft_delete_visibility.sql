-- Soft delete vs RLS (found by the LIFE-18 test battery): Postgres applies the
-- SELECT policy to an UPDATE's new row whenever the UPDATE reads the relation
-- (any WHERE clause does), so `deleted_at is null` in the SELECT policy blocked
-- the soft-delete UPDATE itself for authenticated users.
--
-- Fix: deleted rows stay hidden from everyone EXCEPT the user who deleted them.
-- Bonus: a soft delete that fails to stamp deleted_by = auth.uid() leaves the
-- new row invisible to the updater and is rejected — RLS now enforces the audit
-- stamp. App queries still filter `deleted_at is null` themselves.

alter policy "members read accounts" on public.accounts
  using (public.is_space_member(space_id) and (deleted_at is null or deleted_by = auth.uid()));

alter policy "members read cards" on public.cards
  using (public.is_space_member(space_id) and (deleted_at is null or deleted_by = auth.uid()));

alter policy "members read categories" on public.categories
  using (public.is_space_member(space_id) and (deleted_at is null or deleted_by = auth.uid()));

alter policy "members read transactions" on public.transactions
  using (public.is_space_member(space_id) and (deleted_at is null or deleted_by = auth.uid()));
