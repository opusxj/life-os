-- Fields the headline card needs, and which the entity could not express.
-- See docs/modules/apex/mortgage.md §2.2.
--
-- repayment_type: we assumed everything amortises. Interest-only balances never
--   fall — the capital is due as a lump sum at term end — so a payoff projection
--   showed someone's debt reaching zero in the year they actually owe all of it.
--   ~9% of regulated mortgages, and the norm for buy-to-let.
--
-- balance_as_of: a balance with no date cannot be aged, so the payoff card
--   compared a frozen projection against a moving calendar and reported a
--   deficit exactly equal to the user's absence. Stamped on every balance write.
--
-- reversion_rate: what the mortgage reverts to when the deal ends. Not
--   derivable — SVR is lender-set, not base + N, and some lenders run two.
--   Without it the payment-shock figure cannot be computed at all.
--
-- rate_started_on: how far through the deal we are, and the anchor for an ERC
--   schedule later.

alter table public.mortgages
  add column if not exists repayment_type text not null default 'repayment'
    check (repayment_type in ('repayment', 'interest_only', 'part_and_part')),
  add column if not exists balance_as_of date not null default current_date,
  add column if not exists reversion_rate numeric(5, 3)
    check (reversion_rate is null or (reversion_rate >= 0 and reversion_rate <= 25)),
  add column if not exists rate_started_on date;

comment on column public.mortgages.repayment_type is
  'repayment amortises; interest_only never reduces the balance; part_and_part splits.';
comment on column public.mortgages.balance_as_of is
  'When the balance was last known true. Everything after is projected, not stored.';
comment on column public.mortgages.reversion_rate is
  'Lender SVR / follow-on rate the deal reverts to. User-supplied — not a formula.';

-- Backfill repayment_type by inference: an interest-only payment is within a
-- couple of percent of balance x rate / 12. Same trick the entry form uses, so
-- existing rows land where a new one would.
update public.mortgages
set repayment_type = 'interest_only'
where repayment_type = 'repayment'
  and balance > 0
  and interest_rate > 0
  and monthly_payment > 0
  and abs(monthly_payment - (balance * (interest_rate / 100.0) / 12.0))
      <= greatest(monthly_payment * 0.02, 100);

-- The balance was last touched when the row was; better evidence than today.
update public.mortgages
set balance_as_of = updated_at::date
where balance_as_of = current_date and updated_at::date < current_date;
