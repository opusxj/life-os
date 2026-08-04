-- Totals must never be derived from the row page. `getTransactions` caps at
-- 500 rows; summing that array understated In/Out/Net by an arbitrary amount
-- with no signal (531 rows of £1,759.76 rendered as £500.00). This aggregates
-- in the database over the whole filtered set, and returns the true row count
-- so the UI can say when it is showing a page rather than everything.
--
-- SECURITY INVOKER: RLS applies exactly as it does to the row query.

create or replace function public.apex_transaction_totals(
  p_space_id uuid,
  p_account uuid default null,
  p_card uuid default null,
  p_category uuid default null,
  p_kind text default null,
  -- Half-open [p_from, p_to), matching the row query's month window
  p_from date default null,
  p_to date default null
)
returns table (
  income bigint,
  expense bigint,
  transfer_count integer,
  row_count integer
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(sum(amount) filter (where kind = 'income'), 0)::bigint,
    coalesce(sum(amount) filter (where kind = 'expense'), 0)::bigint,
    (count(*) filter (where kind = 'transfer'))::integer,
    count(*)::integer
  from public.transactions
  where space_id = p_space_id
    and deleted_at is null
    and (p_account is null or account_id = p_account)
    and (p_card is null or card_id = p_card)
    and (p_category is null or category_id = p_category)
    and (p_kind is null or kind = p_kind)
    and (p_from is null or occurred_on >= p_from)
    and (p_to is null or occurred_on < p_to);
$$;

comment on function public.apex_transaction_totals is
  'Filtered In/Out/transfer-count/row-count for a space, aggregated server-side so totals never reflect a truncated page.';
