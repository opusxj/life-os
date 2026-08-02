-- Mortgages (LIFE-29): shared ownership and standard repayment in one shape.
-- Contract: docs/modules/apex.md decisions log #3 — equity_share_pct/rent_monthly
-- nullable (null share = 100% owned); staircasing = updating those fields with
-- the event noted in metadata. Ground rent / service charge / overpayment
-- allowance / staircasing history live in metadata per the 80% rule.

create table public.mortgages (
  id               uuid primary key default gen_random_uuid(),
  space_id         uuid not null references public.spaces (id) on delete cascade,
  name             text not null,
  lender           text not null,
  original_amount  bigint not null check (original_amount > 0),      -- pence; principal at start
  balance          bigint not null check (balance >= 0),             -- pence; manually updated
  interest_rate    numeric(5,2) not null check (interest_rate >= 0), -- percent, e.g. 4.79
  rate_type        text not null check (rate_type in ('fixed', 'variable', 'tracker')),
  rate_ends_on     date,                                             -- fix/deal expiry; the remortgage countdown
  term_ends_on     date not null,
  monthly_payment  bigint not null check (monthly_payment > 0),      -- pence
  property_value   bigint,                                           -- pence; estimate
  equity_share_pct numeric(5,2) check (equity_share_pct > 0 and equity_share_pct <= 100),
  rent_monthly     bigint,                                           -- pence; shared-ownership rent
  notes            text,
  metadata         jsonb not null default '{}',
  created_by       uuid not null references public.profiles (id),
  deleted_at       timestamptz,
  deleted_by       uuid references public.profiles (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index mortgages_space_idx on public.mortgages (space_id);

create trigger mortgages_set_updated_at
  before update on public.mortgages
  for each row execute function public.set_updated_at();

-- RLS: members and up write; guests read; no delete policy — soft delete only,
-- hard deletes happen exclusively via the space-delete cascade.

alter table public.mortgages enable row level security;

create policy "members read mortgages" on public.mortgages
  for select using (
    public.is_space_member(space_id)
    and (deleted_at is null or deleted_by = auth.uid())
  );

create policy "writers insert mortgages" on public.mortgages
  for insert with check (
    public.space_role(space_id) in ('owner', 'admin', 'member') and created_by = auth.uid()
  );

create policy "writers update mortgages" on public.mortgages
  for update using (
    public.space_role(space_id) in ('owner', 'admin', 'member') and deleted_at is null
  ) with check (public.space_role(space_id) in ('owner', 'admin', 'member'));
