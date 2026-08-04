-- `next_due_on + interval '1 month'` clamps, and the clamped date becomes the
-- new anchor. Rent due on the 31st walks 31 -> 28 -> 28 -> 28 and never
-- recovers; quarterly 30 Nov -> 28 Feb; yearly 29 Feb -> 28 Feb. Because the
-- expense posts on next_due_on, spend near a month boundary also lands in the
-- wrong month's budget.
--
-- The row could not express the intent, so store it: anchor_day is the day of
-- the month the payment is really due, and each advance clamps to that month's
-- length without ever losing the original.

alter table public.recurring_payments
  add column if not exists anchor_day smallint
    check (anchor_day between 1 and 31);

comment on column public.recurring_payments.anchor_day is
  'Intended day of month (1-31). Advancing clamps to the month length but keeps this, so a 31st payment stays on the 31st in long months.';

-- Existing rows: today''s due day is the best available evidence of intent.
update public.recurring_payments
set anchor_day = extract(day from next_due_on)::smallint
where anchor_day is null;

create or replace function public.mark_recurring_paid(
  payment_id uuid,
  pay_account uuid default null::uuid
)
returns void
language plpgsql
set search_path to 'public'
as $function$
declare
  payment public.recurring_payments%rowtype;
  paying_account uuid;
  anchor smallint;
  target_month date;
  next_due date;
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

  if payment.cadence = 'weekly' then
    next_due := payment.next_due_on + interval '7 days';
  else
    -- Rebuild from the anchor rather than adding to a previously clamped date
    anchor := coalesce(payment.anchor_day, extract(day from payment.next_due_on)::smallint);
    target_month := date_trunc('month', payment.next_due_on)::date + case payment.cadence
      when 'monthly'   then interval '1 month'
      when 'quarterly' then interval '3 months'
      else                  interval '1 year'
    end;
    next_due := target_month
      + (least(
          anchor,
          extract(day from (date_trunc('month', target_month) + interval '1 month - 1 day'))::smallint
        ) - 1) * interval '1 day';
  end if;

  update public.recurring_payments
  set next_due_on = next_due,
      anchor_day = coalesce(anchor_day, extract(day from payment.next_due_on)::smallint)
  where id = payment.id;
end;
$function$;
