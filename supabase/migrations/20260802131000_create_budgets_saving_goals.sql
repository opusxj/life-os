-- Budgets & saving goals (LIFE-22)
-- Contract: docs/modules/apex.md — monthly envelopes per category (the period
-- is implicitly monthly for MVP; spent is computed from the month's live
-- expense transactions at query time) and progress-grid saving goals that are
-- either linked to an account (progress = its balance) or standalone
-- (progress = saved_amount, bumped by Top up).

-- ----------------------------------------------------------------- budgets

create table public.budgets (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces (id) on delete cascade,
  category_id uuid not null,
  amount      bigint not null check (amount > 0), -- pence per calendar month
  notes       text,
  metadata    jsonb not null default '{}',
  created_by  uuid not null references public.profiles (id),
  deleted_at  timestamptz,
  deleted_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  foreign key (category_id, space_id) references public.categories (id, space_id) on delete cascade
);

create index budgets_space_idx on public.budgets (space_id);

-- one live envelope per category; soft-deleted rows free the slot
create unique index budgets_space_category_key
  on public.budgets (space_id, category_id)
  where deleted_at is null;

create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------- saving_goals

create table public.saving_goals (
  id            uuid primary key default gen_random_uuid(),
  space_id      uuid not null references public.spaces (id) on delete cascade,
  name          text not null,
  target_amount bigint not null check (target_amount > 0), -- pence
  account_id    uuid, -- linked: progress = account balance; null = saved_amount
  saved_amount  bigint not null default 0 check (saved_amount >= 0),
  target_on     date,
  color         text not null,
  notes         text,
  metadata      jsonb not null default '{}',
  created_by    uuid not null references public.profiles (id),
  deleted_at    timestamptz,
  deleted_by    uuid references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  foreign key (account_id, space_id) references public.accounts (id, space_id) on delete set null (account_id)
);

create index saving_goals_space_idx on public.saving_goals (space_id);

create trigger saving_goals_set_updated_at
  before update on public.saving_goals
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------- RLS
-- Members and up write; guests read; nobody hard-deletes (soft delete only,
-- hard deletes happen exclusively via the space-delete cascade). Deleted rows
-- stay visible to their deleter so the stamped soft-delete UPDATE passes.

alter table public.budgets enable row level security;
alter table public.saving_goals enable row level security;

create policy "members read budgets" on public.budgets
  for select using (
    public.is_space_member(space_id) and (deleted_at is null or deleted_by = auth.uid())
  );
create policy "writers insert budgets" on public.budgets
  for insert with check (
    public.space_role(space_id) in ('owner', 'admin', 'member') and created_by = auth.uid()
  );
create policy "writers update budgets" on public.budgets
  for update using (
    public.space_role(space_id) in ('owner', 'admin', 'member') and deleted_at is null
  ) with check (public.space_role(space_id) in ('owner', 'admin', 'member'));

create policy "members read saving_goals" on public.saving_goals
  for select using (
    public.is_space_member(space_id) and (deleted_at is null or deleted_by = auth.uid())
  );
create policy "writers insert saving_goals" on public.saving_goals
  for insert with check (
    public.space_role(space_id) in ('owner', 'admin', 'member') and created_by = auth.uid()
  );
create policy "writers update saving_goals" on public.saving_goals
  for update using (
    public.space_role(space_id) in ('owner', 'admin', 'member') and deleted_at is null
  ) with check (public.space_role(space_id) in ('owner', 'admin', 'member'));
