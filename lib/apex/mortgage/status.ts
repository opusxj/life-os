// What the headline card is answering right now. A mortgage is quiet for years
// and then, for a few months every two to five years, one thing matters more
// than everything else on the page. The stage decides which.
//
// Research: docs/modules/apex/mortgage.md §3.1. Anxiety here comes from
// uncertainty, not from the number — and a countdown attached to no available
// action is an avoidance trigger, so `watch` says "nothing to do yet" out loud.

import {
  monthlyPayment,
  monthsBetween,
  monthsToRepay,
  projectBalance,
  type RepaymentType,
} from "./amortization"
import type { Mortgage } from "./queries"

export type MortgageStage =
  /** Deal running with more than 6 months left, or no deal to end */
  | "settled"
  /** Deal ends in 6–18 months: visible, but nothing to do yet */
  | "watch"
  /** Inside the arrange-a-new-deal window */
  | "act"
  /** The deal has ended — paying the reversion rate */
  | "reverted"

/** Lenders let you reserve a new product this far ahead (Mortgage Charter). */
export const ARRANGE_WINDOW_MONTHS = 6
/** Before this the countdown is noise — there is nothing you can do with it. */
const WATCH_WINDOW_MONTHS = 18

export type MortgageStatus = {
  stage: MortgageStage
  /** The stored balance aged forward to today — never the raw column */
  balanceToday: number
  /** How stale the stored balance is; drives nothing user-facing but the tooltip */
  monthsSinceBalance: number
  /** Negative once the deal has ended; null when there is no deal end */
  monthsToRateEnd: number | null
  /** When a new deal can first be reserved */
  arrangeFrom: Date | null
  /** Monthly payment once the deal reverts, when we can compute it */
  reversionPayment: number | null
  /** reversionPayment − current payment. The headline in `act` and `reverted` */
  shock: number | null
  /** Why we can't compute the shock, when we can't */
  missing: "reversion_rate" | null
  /** Months until the balance clears at today's payment and rate */
  monthsToFree: number | null
  /** True when the capital falls due as a lump sum rather than amortising */
  lumpSumAtTerm: boolean
}

/**
 * `today` is resolved server-side and passed in so SSR and hydration agree —
 * same contract as `dueState` in components/apex/due-state.tsx.
 */
export function mortgageStatus(
  mortgage: Mortgage,
  today: string
): MortgageStatus {
  const now = parseDay(today)
  const repaymentType = mortgage.repaymentType as RepaymentType

  const monthsSinceBalance = Math.max(
    0,
    monthsBetween(parseDay(mortgage.balanceAsOf), now)
  )
  const balanceToday = projectBalance(
    mortgage.balance,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    monthsSinceBalance,
    repaymentType
  )

  const rateEnd = mortgage.rateEndsOn ? parseDay(mortgage.rateEndsOn) : null
  const monthsToRateEnd = rateEnd ? monthsBetween(now, rateEnd) : null

  const stage = resolveStage(monthsToRateEnd)
  const arrangeFrom = rateEnd
    ? new Date(
        rateEnd.getFullYear(),
        rateEnd.getMonth() - ARRANGE_WINDOW_MONTHS,
        rateEnd.getDate()
      )
    : null

  const { reversionPayment, shock, missing } = resolveShock(
    mortgage,
    balanceToday,
    monthsToRateEnd,
    now,
    repaymentType
  )

  // Interest-only never clears itself, so a payoff figure would be a lie
  const lumpSumAtTerm = repaymentType !== "repayment"
  const monthsToFree = lumpSumAtTerm
    ? null
    : monthsToRepay(
        balanceToday,
        mortgage.interestRate,
        mortgage.monthlyPayment
      )

  return {
    stage,
    balanceToday,
    monthsSinceBalance,
    monthsToRateEnd,
    arrangeFrom,
    reversionPayment,
    shock,
    missing,
    monthsToFree,
    lumpSumAtTerm,
  }
}

function resolveStage(monthsToRateEnd: number | null): MortgageStage {
  if (monthsToRateEnd === null) return "settled"
  if (monthsToRateEnd < 0) return "reverted"
  if (monthsToRateEnd <= ARRANGE_WINDOW_MONTHS) return "act"
  if (monthsToRateEnd <= WATCH_WINDOW_MONTHS) return "watch"
  return "settled"
}

/**
 * What the payment becomes at the reversion rate. Computed on the balance
 * *projected to the deal end*, over the term remaining at that point — not
 * today's balance, which would understate it.
 *
 * The reversion rate cannot be derived: SVR is lender-set, not base + N, and
 * some lenders run more than one. When it's absent we say so rather than guess,
 * because this figure is the whole point of the card.
 */
function resolveShock(
  mortgage: Mortgage,
  balanceToday: number,
  monthsToRateEnd: number | null,
  now: Date,
  repaymentType: RepaymentType
): Pick<MortgageStatus, "reversionPayment" | "shock" | "missing"> {
  if (mortgage.reversionRate === null) {
    return { reversionPayment: null, shock: null, missing: "reversion_rate" }
  }

  const monthsAhead = Math.max(0, monthsToRateEnd ?? 0)
  const balanceAtRateEnd = projectBalance(
    balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    monthsAhead,
    repaymentType
  )

  const termEnd = parseDay(mortgage.termEndsOn)
  const monthsRemaining = monthsBetween(now, termEnd) - monthsAhead
  if (monthsRemaining <= 0 || balanceAtRateEnd <= 0) {
    return { reversionPayment: null, shock: null, missing: null }
  }

  const reversionPayment =
    repaymentType === "interest_only"
      ? Math.round((balanceAtRateEnd * (mortgage.reversionRate / 100)) / 12)
      : monthlyPayment(
          balanceAtRateEnd,
          mortgage.reversionRate,
          monthsRemaining
        )

  return {
    reversionPayment,
    shock: reversionPayment - mortgage.monthlyPayment,
    missing: null,
  }
}

/** yyyy-mm-dd → local midnight, so month arithmetic doesn't drift a day */
function parseDay(key: string): Date {
  return new Date(`${key}T00:00:00`)
}
