-- Apex core: accounts, cards, categories, transactions (LIFE-18)
-- Contract: docs/modules/apex.md — hybrid balances, account-anchored transactions,
-- optional card tag, signed adjustments. recurring_payment_id arrives with LIFE-27.

-- ----------------------------------------------------------------- accounts

create table public.accounts (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces (id) on delete cascade,
  name        text not null,
  kind        text not null check (kind in ('current', 'savings', 'credit_card', 'investment', 'cash')),
  institution text,
  balance     bigint not null default 0, -- pence, signed; maintained by the transactions trigger
  currency    char(3) not null default 'GBP',
  color       text not null,
  notes       text,
  metadata    jsonb not null default '{}',
  created_by  uuid not null references public.profiles (id),
  deleted_at  timestamptz,
  deleted_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- lets child tables FK on (id, space_id) so cross-space references are impossible
  unique (id, space_id)
);

create index accounts_space_idx on public.accounts (space_id);

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------- cards

create table public.cards (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces (id) on delete cascade,
  account_id  uuid not null,
  name        text not null,
  brand       text check (brand in ('visa', 'mastercard', 'amex', 'other')),
  last4       char(4) check (last4 ~ '^[0-9]{4}$'), -- display only; full numbers are never stored
  expires_on  date,
  color       text not null,
  notes       text,
  metadata    jsonb not null default '{}',
  created_by  uuid not null references public.profiles (id),
  deleted_at  timestamptz,
  deleted_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  foreign key (account_id, space_id) references public.accounts (id, space_id) on delete cascade,
  -- lets transactions FK on (card_id, account_id) so a card tag always matches its account
  unique (id, account_id)
);

create index cards_space_idx on public.cards (space_id);
create index cards_account_idx on public.cards (account_id);

create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------- categories

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces (id) on delete cascade,
  name        text not null,
  kind        text not null check (kind in ('income', 'expense')),
  color       text not null,
  icon        text not null, -- lucide icon name, kebab-case
  notes       text,
  metadata    jsonb not null default '{}',
  created_by  uuid not null references public.profiles (id),
  deleted_at  timestamptz,
  deleted_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, space_id)
);

create unique index categories_space_name_key
  on public.categories (space_id, name)
  where deleted_at is null;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------- transactions

create table public.transactions (
  id                  uuid primary key default gen_random_uuid(),
  space_id            uuid not null references public.spaces (id) on delete cascade,
  account_id          uuid not null,
  card_id             uuid,
  kind                text not null check (kind in ('income', 'expense', 'transfer', 'adjustment')),
  amount              bigint not null,
  description         text not null,
  category_id         uuid,
  occurred_on         date not null default current_date,
  transfer_account_id uuid,
  notes               text,
  metadata            jsonb not null default '{}',
  created_by          uuid not null references public.profiles (id),
  deleted_at          timestamptz,
  deleted_by          uuid references public.profiles (id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  foreign key (account_id, space_id) references public.accounts (id, space_id) on delete cascade,
  foreign key (transfer_account_id, space_id) references public.accounts (id, space_id) on delete cascade,
  foreign key (card_id, account_id) references public.cards (id, account_id) on delete set null (card_id),
  foreign key (category_id, space_id) references public.categories (id, space_id) on delete set null (category_id),
  -- amount is positive with direction from kind; adjustments carry the signed sync delta
  constraint transactions_amount_direction check (kind = 'adjustment' or amount > 0),
  constraint transactions_amount_nonzero check (amount <> 0),
  constraint transactions_transfer_target check ((kind = 'transfer') = (transfer_account_id is not null)),
  constraint transactions_transfer_distinct check (transfer_account_id is null or transfer_account_id <> account_id)
);

create index transactions_space_date_idx on public.transactions (space_id, occurred_on desc);
create index transactions_account_idx on public.transactions (account_id);
create index transactions_category_idx on public.transactions (category_id);

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ------------------------------------------------- hybrid balance maintenance
-- Every live transaction moves its account's balance; soft delete reverts it.
-- Definer so the shift always lands; not user-callable (execute revoked below).

create or replace function public.shift_balances(acct uuid, xfer uuid, txn_kind text, delta bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if txn_kind in ('income', 'adjustment') then
    update public.accounts set balance = balance + delta where id = acct;
  elsif txn_kind = 'expense' then
    update public.accounts set balance = balance - delta where id = acct;
  elsif txn_kind = 'transfer' then
    update public.accounts set balance = balance - delta where id = acct;
    update public.accounts set balance = balance + delta where id = xfer;
  end if;
end;
$$;

revoke execute on function public.shift_balances(uuid, uuid, text, bigint) from public, anon, authenticated;

create or replace function public.apply_transaction_to_balances()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- revert the old effect (negated delta), then apply the new one;
  -- soft-deleted rows have no effect, so soft delete/restore just works
  if tg_op in ('UPDATE', 'DELETE') and old.deleted_at is null then
    perform public.shift_balances(old.account_id, old.transfer_account_id, old.kind, -old.amount);
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.deleted_at is null then
    perform public.shift_balances(new.account_id, new.transfer_account_id, new.kind, new.amount);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger transactions_apply_balances
  after insert or update or delete on public.transactions
  for each row execute function public.apply_transaction_to_balances();

-- ----------------------------------------------------------------- seeding
-- Lazily called by the app when a space opens Apex with no categories.
-- Invoker security: RLS applies, so only writing members can seed.

create or replace function public.seed_default_categories(target_space uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into public.categories (space_id, name, kind, color, icon, created_by)
  values
    (target_space, 'Groceries',     'expense', '#10b981', 'shopping-basket', auth.uid()),
    (target_space, 'Eating Out',    'expense', '#f59e0b', 'utensils',        auth.uid()),
    (target_space, 'Transport',     'expense', '#0ea5e9', 'bus',             auth.uid()),
    (target_space, 'Fuel',          'expense', '#f97316', 'fuel',            auth.uid()),
    (target_space, 'Home',          'expense', '#8b5cf6', 'house',           auth.uid()),
    (target_space, 'Utilities',     'expense', '#eab308', 'plug-zap',        auth.uid()),
    (target_space, 'Entertainment', 'expense', '#ec4899', 'clapperboard',    auth.uid()),
    (target_space, 'Health',        'expense', '#ef4444', 'heart-pulse',     auth.uid()),
    (target_space, 'Kids',          'expense', '#06b6d4', 'baby',            auth.uid()),
    (target_space, 'Gifts',         'expense', '#f43f5e', 'gift',            auth.uid()),
    (target_space, 'Holidays',      'expense', '#14b8a6', 'plane',           auth.uid()),
    (target_space, 'Shopping',      'expense', '#d946ef', 'shopping-bag',    auth.uid()),
    (target_space, 'Insurance',     'expense', '#64748b', 'shield',          auth.uid()),
    (target_space, 'Housing',       'expense', '#6b7280', 'landmark',        auth.uid()),
    (target_space, 'Salary',        'income',  '#10b981', 'banknote',        auth.uid()),
    (target_space, 'Other income',  'income',  '#6b7280', 'coins',           auth.uid())
  on conflict (space_id, name) where deleted_at is null do nothing;
end;
$$;

-- ----------------------------------------------------------------- RLS
-- Members and up write; guests read; nobody hard-deletes (soft delete only,
-- hard deletes happen exclusively via the space-delete cascade).

alter table public.accounts enable row level security;
alter table public.cards enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "members read accounts" on public.accounts
  for select using (public.is_space_member(space_id) and deleted_at is null);
create policy "writers insert accounts" on public.accounts
  for insert with check (
    public.space_role(space_id) in ('owner', 'admin', 'member') and created_by = auth.uid()
  );
create policy "writers update accounts" on public.accounts
  for update using (
    public.space_role(space_id) in ('owner', 'admin', 'member') and deleted_at is null
  ) with check (public.space_role(space_id) in ('owner', 'admin', 'member'));

create policy "members read cards" on public.cards
  for select using (public.is_space_member(space_id) and deleted_at is null);
create policy "writers insert cards" on public.cards
  for insert with check (
    public.space_role(space_id) in ('owner', 'admin', 'member') and created_by = auth.uid()
  );
create policy "writers update cards" on public.cards
  for update using (
    public.space_role(space_id) in ('owner', 'admin', 'member') and deleted_at is null
  ) with check (public.space_role(space_id) in ('owner', 'admin', 'member'));

create policy "members read categories" on public.categories
  for select using (public.is_space_member(space_id) and deleted_at is null);
create policy "writers insert categories" on public.categories
  for insert with check (
    public.space_role(space_id) in ('owner', 'admin', 'member') and created_by = auth.uid()
  );
create policy "writers update categories" on public.categories
  for update using (
    public.space_role(space_id) in ('owner', 'admin', 'member') and deleted_at is null
  ) with check (public.space_role(space_id) in ('owner', 'admin', 'member'));

create policy "members read transactions" on public.transactions
  for select using (public.is_space_member(space_id) and deleted_at is null);
create policy "writers insert transactions" on public.transactions
  for insert with check (
    public.space_role(space_id) in ('owner', 'admin', 'member') and created_by = auth.uid()
  );
create policy "writers update transactions" on public.transactions
  for update using (
    public.space_role(space_id) in ('owner', 'admin', 'member') and deleted_at is null
  ) with check (public.space_role(space_id) in ('owner', 'admin', 'member'));
