-- Recurring payments: subscriptions & bills schedule (LIFE-27)
-- Contract: docs/modules/apex.md — schedule + Mark paid (decision 4), cancel =
-- soft delete (decision 8). Nothing auto-posts; mark_recurring_paid creates the
-- expense transaction and rolls next_due_on in one atomic call.

-- ------------------------------------------------------- recurring_payments

create table public.recurring_payments (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces (id) on delete cascade,
  name        text not null,
  kind        text not null check (kind in ('subscription', 'bill')),
  amount      bigint not null check (amount > 0), -- pence
  cadence     text not null check (cadence in ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_due_on date not null,
  account_id  uuid, -- which account pays; null = ask on Mark paid
  category_id uuid, -- applied to the transaction on Mark paid
  notes       text,
  metadata    jsonb not null default '{}',
  created_by  uuid not null references public.profiles (id),
  deleted_at  timestamptz,
  deleted_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  foreign key (account_id, space_id) references public.accounts (id, space_id) on delete set null (account_id),
  foreign key (category_id, space_id) references public.categories (id, space_id) on delete set null (category_id),
  -- lets transactions FK on (id, space_id) so cross-space references are impossible
  unique (id, space_id)
);

create index recurring_payments_space_due_idx
  on public.recurring_payments (space_id, next_due_on);

create trigger recurring_payments_set_updated_at
  before update on public.recurring_payments
  for each row execute function public.set_updated_at();

-- ------------------------------------------- transactions.recurring_payment_id
-- Set by Mark paid; powers per-item payment history (reserved in LIFE-18).

alter table public.transactions
  add column recurring_payment_id uuid,
  add foreign key (recurring_payment_id, space_id)
    references public.recurring_payments (id, space_id) on delete set null (recurring_payment_id);

create index transactions_recurring_idx
  on public.transactions (recurring_payment_id);

-- ----------------------------------------------------------------- mark paid
-- One tap on a due row: creates the expense transaction (balance moves via the
-- LIFE-18 trigger) and advances next_due_on by one cadence step FROM the due
-- date. Invoker security: RLS applies, so only writing members of the payment's
-- space can call it, and both writes succeed or fail together.

create or replace function public.mark_recurring_paid(payment_id uuid, pay_account uuid default null)
returns void
language plpgsql
set search_path = public
as $$
declare
  payment public.recurring_payments%rowtype;
  paying_account uuid;
begin
  select * into payment
  from public.recurring_payments
  where id = payment_id and deleted_at is null;

  if not found then
    raise exception 'Recurring payment not found.';
  end if;

  paying_account := coalesce(pay_account, payment.account_id);
  if paying_account is null then
    raise exception 'Pick an account to pay from — this item has no paying account set.';
  end if;

  insert into public.transactions
    (space_id, account_id, kind, amount, description, category_id, occurred_on, recurring_payment_id, created_by)
  values
    (payment.space_id, paying_account, 'expense', payment.amount, payment.name,
     payment.category_id, payment.next_due_on, payment.id, auth.uid());

  update public.recurring_payments
  set next_due_on = (payment.next_due_on + case payment.cadence
    when 'weekly'    then interval '7 days'
    when 'monthly'   then interval '1 month'
    when 'quarterly' then interval '3 months'
    else                  interval '1 year'
  end)::date
  where id = payment.id;
end;
$$;

-- ----------------------------------------------------------------- RLS
-- Members and up write; guests read; nobody hard-deletes (soft delete only,
-- hard deletes happen exclusively via the space-delete cascade).

alter table public.recurring_payments enable row level security;

create policy "members read recurring_payments" on public.recurring_payments
  for select using (
    public.is_space_member(space_id)
    and (deleted_at is null or deleted_by = auth.uid())
  );
create policy "writers insert recurring_payments" on public.recurring_payments
  for insert with check (
    public.space_role(space_id) in ('owner', 'admin', 'member') and created_by = auth.uid()
  );
create policy "writers update recurring_payments" on public.recurring_payments
  for update using (
    public.space_role(space_id) in ('owner', 'admin', 'member') and deleted_at is null
  ) with check (public.space_role(space_id) in ('owner', 'admin', 'member'));
