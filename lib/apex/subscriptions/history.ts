// What the payment history says about the schedule — the past-facing twin of
// schedule.ts. Everything here is derived from Mark paid's stamps; nothing is
// stored.

import { monthlyPence, type PaymentStamp, type RecurringPayment } from "./queries"

/** Latest stamp per item. Stamps arrive newest first, so first seen wins. */
export function lastPaidFromStamps(
  stamps: PaymentStamp[]
): Record<string, string> {
  const lastPaid: Record<string, string> = {}
  for (const stamp of stamps) {
    if (!(stamp.paymentId in lastPaid)) {
      lastPaid[stamp.paymentId] = stamp.occurredOn
    }
  }
  return lastPaid
}

export type PriceRiser = {
  id: string
  name: string
  /** Current price minus the first price ever paid, both scaled to a month */
  deltaMonthly: number
  /** The real charge amounts, in the item's own cadence */
  fromAmount: number
  toAmount: number
  /** The unit the item bills in today; the annual footnote's arithmetic */
  cadence: RecurringPayment["cadence"]
  /** "since": the rise has been paid at least once, dated by its first stamp.
   *  "from": the rise is recorded but not yet paid; the date is the next due. */
  story: { kind: "since" | "from"; on: string }
}

/**
 * Items whose current price is above the first price ever paid for them.
 * Multi-step rises collapse into first-to-current, which is what "against the
 * first one you paid" promises. Falls are deliberately not listed: this card
 * names creep, and a schedule with none (or only drops) simply has no card.
 * Both ends normalize through the item's current cadence; a cadence change
 * rewrites history no stamp can tell apart, so the comparison stays honest
 * only in the unit the item bills in today. Paused items are skipped — they
 * are excluded from every live answer.
 */
export function priceRisers(
  payments: RecurringPayment[],
  stamps: PaymentStamp[]
): PriceRiser[] {
  const byPayment = new Map<string, PaymentStamp[]>()
  for (const stamp of stamps) {
    const list = byPayment.get(stamp.paymentId)
    if (list) list.push(stamp)
    else byPayment.set(stamp.paymentId, [stamp])
  }

  const risers: PriceRiser[] = []
  for (const payment of payments) {
    if (payment.paused) continue
    const history = byPayment.get(payment.id)
    if (!history || history.length === 0) continue

    // Newest first, so the baseline is the last entry
    const first = history[history.length - 1]
    if (payment.amount <= first.amount) continue

    // The first stamp at the current price, if the rise has been paid yet.
    // Newest-first: the last matching entry is the earliest such payment.
    const paidAtCurrent = [...history]
      .reverse()
      .find((stamp) => stamp.amount === payment.amount)

    risers.push({
      id: payment.id,
      name: payment.name,
      deltaMonthly:
        monthlyPence(payment.amount, payment.cadence) -
        monthlyPence(first.amount, payment.cadence),
      fromAmount: first.amount,
      toAmount: payment.amount,
      cadence: payment.cadence,
      story: paidAtCurrent
        ? { kind: "since", on: paidAtCurrent.occurredOn }
        : { kind: "from", on: payment.nextDueOn },
    })
  }

  return risers.sort((a, b) => b.deltaMonthly - a.deltaMonthly)
}
