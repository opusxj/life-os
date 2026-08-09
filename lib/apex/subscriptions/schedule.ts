// The recurring schedule projected onto the calendar, entirely derived —
// nothing here is stored (apex.md decision #10).
//
// `advance` is a TS port of the SQL advance rule in
// supabase/migrations/20260804210000_recurring_anchor_day.sql and must stay
// in step with it: weekly adds seven days; every other cadence rebuilds the
// target month from the *stored anchor day* and clamps to that month's
// length, so a payment anchored on the 31st visits the 30th and the 28th but
// returns to the 31st in long months instead of walking backwards for good.

import { parseDay } from "@/lib/apex/dates"

import type { RecurringCadence, RecurringPayment } from "./queries"

/** The due-soon window: Mark paid is offered and "due soon" copy fires
 *  inside it. One definition for every surface that measures it. */
export const DUE_SOON_DAYS = 7

const CADENCE_MONTHS: Record<Exclude<RecurringCadence, "weekly">, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
}

/** The occurrence after `dateKey`, per the SQL rule above. */
export function advance(
  dateKey: string,
  cadence: RecurringCadence,
  anchorDay: number | null
): string {
  const date = parseDay(dateKey)
  if (cadence === "weekly") {
    date.setDate(date.getDate() + 7)
    return dayKey(date)
  }
  const anchor = anchorDay ?? date.getDate()
  const target = new Date(
    date.getFullYear(),
    date.getMonth() + CADENCE_MONTHS[cadence],
    1
  )
  target.setDate(Math.min(anchor, daysInMonth(target)))
  return dayKey(target)
}

export type MonthProjection = {
  /** yyyy-mm */
  month: string
  /** pence landing in the month, by kind */
  bills: number
  subscriptions: number
  /** The largest single occurrence — names the ambush in a footnote */
  biggest: { name: string; amount: number } | null
}

type ProjectablePayment = Pick<
  RecurringPayment,
  "name" | "kind" | "amount" | "cadence" | "nextDueOn" | "anchorDay"
>

/**
 * The next `months` calendar months, starting with the month *after* `today`:
 * the current month is part-spent, and a partial column would mislead.
 * Occurrences use each item's real amount on its real date, which is the
 * whole point — a yearly premium lands in one month, not a twelfth at a time.
 */
export function monthTotals(
  payments: ProjectablePayment[],
  today: string,
  months = 12
): MonthProjection[] {
  const now = parseDay(today)
  const first = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const projections: MonthProjection[] = Array.from(
    { length: months },
    (_, index) => {
      const month = new Date(first.getFullYear(), first.getMonth() + index, 1)
      return { month: monthKey(month), bills: 0, subscriptions: 0, biggest: null }
    }
  )
  const byMonth = new Map(projections.map((entry) => [entry.month, entry]))

  const startKey = dayKey(first)
  const endKey = dayKey(
    new Date(first.getFullYear(), first.getMonth() + months, 0)
  )

  for (const payment of payments) {
    let occurrence = payment.nextDueOn
    // An overdue row walks forward into the window; the cap only guards a
    // pathological date far in the past. yyyy-mm-dd compares as it sorts.
    for (let step = 0; occurrence <= endKey && step < 1000; step++) {
      if (occurrence >= startKey) {
        const bucket = byMonth.get(occurrence.slice(0, 7))
        if (bucket) {
          if (payment.kind === "bill") bucket.bills += payment.amount
          else bucket.subscriptions += payment.amount
          if (!bucket.biggest || payment.amount > bucket.biggest.amount) {
            bucket.biggest = { name: payment.name, amount: payment.amount }
          }
        }
      }
      occurrence = advance(occurrence, payment.cadence, payment.anchorDay)
    }
  }

  return projections
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function dayKey(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function monthKey(date: Date): string {
  return dayKey(date).slice(0, 7)
}
