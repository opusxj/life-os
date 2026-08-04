-- seed_default_categories() has existed since the first Apex migration and was
-- never called from anywhere. Every space created through the app — including
-- the personal space handle_new_user() makes at signup — came out with zero
-- categories, so a new user opened Apex to an empty category picker, every
-- transaction uncategorised and budgets unusable.
--
-- Seeding moves onto a trigger so it can never be forgotten again.
--
-- The creator is passed in rather than read from auth.uid(): during signup the
-- seeding runs inside handle_new_user(), where there is no JWT yet and
-- auth.uid() is null — which would violate categories.created_by NOT NULL and
-- take the whole signup down with it.

drop function if exists public.seed_default_categories(uuid);

create function public.seed_default_categories(
  target_space uuid,
  creator uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid := coalesce(creator, auth.uid());
begin
  if owner_id is null then
    return;
  end if;

  insert into public.categories (space_id, name, kind, color, icon, created_by)
  values
    (target_space, 'Groceries',     'expense', '#10b981', 'shopping-basket', owner_id),
    (target_space, 'Eating Out',    'expense', '#f59e0b', 'utensils',        owner_id),
    (target_space, 'Transport',     'expense', '#0ea5e9', 'bus',             owner_id),
    (target_space, 'Fuel',          'expense', '#f97316', 'fuel',            owner_id),
    (target_space, 'Home',          'expense', '#8b5cf6', 'house',           owner_id),
    (target_space, 'Utilities',     'expense', '#eab308', 'plug-zap',        owner_id),
    (target_space, 'Entertainment', 'expense', '#ec4899', 'clapperboard',    owner_id),
    (target_space, 'Health',        'expense', '#ef4444', 'heart-pulse',     owner_id),
    (target_space, 'Kids',          'expense', '#06b6d4', 'baby',            owner_id),
    (target_space, 'Gifts',         'expense', '#f43f5e', 'gift',            owner_id),
    (target_space, 'Holidays',      'expense', '#14b8a6', 'plane',           owner_id),
    (target_space, 'Shopping',      'expense', '#d946ef', 'shopping-bag',    owner_id),
    (target_space, 'Insurance',     'expense', '#64748b', 'shield',          owner_id),
    (target_space, 'Housing',       'expense', '#6b7280', 'landmark',        owner_id),
    (target_space, 'Salary',        'income',  '#10b981', 'banknote',        owner_id),
    (target_space, 'Other income',  'income',  '#6b7280', 'coins',           owner_id)
  on conflict (space_id, name) where deleted_at is null do nothing;
end;
$$;

create or replace function public.seed_space_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_categories(new.id, new.created_by);
  return new;
end;
$$;

drop trigger if exists spaces_seed_categories on public.spaces;

-- Name sorts after spaces_add_creator_membership so membership exists first
create trigger spaces_seed_categories
after insert on public.spaces
for each row execute function public.seed_space_categories();

-- Backfill the spaces that were created before the trigger existed
do $$
declare
  space record;
begin
  for space in
    select s.id, s.created_by
    from public.spaces s
    where s.deleted_at is null
      and not exists (
        select 1 from public.categories c
        where c.space_id = s.id and c.deleted_at is null
      )
  loop
    perform public.seed_default_categories(space.id, space.created_by);
  end loop;
end $$;
