import { Flag } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { ApexStatCard, ApexStatTag } from "@/components/apex/stat-card"
import { cn } from "@/lib/utils"
import {
  balanceSeries,
  monthsBetween,
  monthsFromNow,
} from "@/lib/apex/mortgage/amortization"
import { formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { lendingBase, type MortgageStatus } from "@/lib/apex/mortgage/status"

import { formatMonthYear } from "./format"

/**
 * What happens next, and when: the next three moments worth noticing on the
 * way down — round-number balances, lender LTV pricing bands, fractions of
 * the original loan repaid — each with the month the projection reaches it.
 *
 * Interest-only balances never fall, and neither does one whose payment
 * doesn't cover the interest, so in both cases the card renders nothing:
 * there are no milestones on a flat line.
 */
export function MilestonesCard({
  mortgage,
  status,
  today,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  /** yyyy-mm-dd resolved server-side, the same clock every sibling card uses */
  today: string
  className?: string
}) {
  if (status.lumpSumAtTerm || status.monthsToFree === null) return null

  const now = new Date(`${today}T00:00:00`)
  const milestones = nextMilestones(mortgage, status, now)
  if (milestones.length === 0) return null

  return (
    <ApexStatCard
      label="Milestones"
      description="Projected at today's payment and rate"
      icon={Flag}
      iconClassName={ANCHOR_TINTS.due}
      className={className}
    >
      <ul>
        {milestones.map((milestone, index) => (
          <li
            key={milestone.label}
            className={cn(
              "flex items-center gap-3 py-2.5",
              index < milestones.length - 1 && "border-b"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-7.5 shrink-0 items-center justify-center rounded-[10px] [&>svg]:size-4",
                ANCHOR_TINTS.due
              )}
            >
              <Flag />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">
              {milestone.label}
            </span>
            <ApexStatTag tint="balance" className="shrink-0">
              {formatMonthYear(monthsFromNow(milestone.month, now))}
            </ApexStatTag>
          </li>
        ))}
      </ul>
    </ApexStatCard>
  )
}

type Milestone = {
  /** Whole months from today until the projection crosses the threshold */
  month: number
  label: string
  /** Same-month tie-break: lower wins (a pricing band beats a round number) */
  rank: number
}

type Candidate = Pick<Milestone, "label" | "rank"> & {
  /** The milestone lands the first month the balance is at or below this */
  threshold: number
}

/** £10,000 in pence: the round-number rhythm of a falling balance */
const FLOOR_STEP = 1_000_000
/** LTV breakpoints lenders price at; each step down unlocks cheaper deals */
const LTV_BANDS = [90, 85, 80, 75, 60]
/** Fractions of the original loan worth marking when repaid */
const REPAID_STOPS = [10, 25, 50, 75]
/** Same sanity ceiling as lib/apex/mortgage/amortization */
const MAX_MONTHS = 1200

/**
 * Walk the balance forward via the library's own series (one shared definition
 * of the monthly step) until payoff or term end, recording the month each
 * candidate threshold is crossed. The balance only falls here (monthsToFree is
 * non-null, so the payment beats the interest), so candidates sorted by
 * threshold descending are crossed in order. When two land in the same month,
 * one row: band beats repaid beats floor.
 */
function nextMilestones(
  mortgage: Mortgage,
  status: MortgageStatus,
  now: Date
): Milestone[] {
  const candidates = buildCandidates(mortgage, status.balanceToday)
  if (candidates.length === 0) return []
  candidates.sort((a, b) => b.threshold - a.threshold || a.rank - b.rank)

  const termEnd = new Date(`${mortgage.termEndsOn}T00:00:00`)
  const horizon = Math.min(
    status.monthsToFree ?? MAX_MONTHS,
    Math.max(0, monthsBetween(now, termEnd)),
    MAX_MONTHS
  )

  const series = balanceSeries(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    horizon
  )
  const hits: Milestone[] = []
  let index = 0
  for (
    let month = 1;
    month < series.length && index < candidates.length;
    month++
  ) {
    const balance = series[month]
    while (index < candidates.length && balance <= candidates[index].threshold) {
      const { label, rank } = candidates[index]
      hits.push({ month, label, rank })
      index += 1
    }
    if (balance <= 0) break
  }

  hits.sort((a, b) => a.month - b.month || a.rank - b.rank)
  const seen = new Set<number>()
  const next: Milestone[] = []
  for (const hit of hits) {
    if (seen.has(hit.month)) continue
    seen.add(hit.month)
    next.push(hit)
    if (next.length === 3) break
  }
  return next
}

/** Every threshold still ahead of today's balance, across the three kinds. */
function buildCandidates(
  mortgage: Mortgage,
  balanceToday: number
): Candidate[] {
  const candidates: Candidate[] = []

  // a) Each £10,000 floor strictly below today's balance. £0 is excluded:
  //    payoff is the Payoff card's answer, not a row here.
  const firstFloor =
    Math.ceil(balanceToday / FLOOR_STEP) * FLOOR_STEP - FLOOR_STEP
  for (let floor = firstFloor; floor >= FLOOR_STEP; floor -= FLOOR_STEP) {
    candidates.push({
      threshold: floor,
      label: `Balance under ${formatPenceShort(floor)}`,
      rank: 2,
    })
  }

  // b) LTV pricing bands not yet reached, against what the loan is secured on
  const base = lendingBase(mortgage)
  if (base !== null) {
    for (const band of LTV_BANDS) {
      const threshold = Math.round((base.value * band) / 100)
      if (threshold >= balanceToday) continue
      candidates.push({
        threshold,
        label: base.shared
          ? `Into the ${band}% band on your share`
          : `Into the ${band}% band`,
        rank: 0,
      })
    }
  }

  // c) Fractions of the original loan repaid
  for (const stop of REPAID_STOPS) {
    const threshold = Math.round(mortgage.originalAmount * (1 - stop / 100))
    if (threshold >= balanceToday) continue
    candidates.push({
      threshold,
      label: `${stop}% of the loan repaid`,
      rank: 1,
    })
  }

  return candidates
}
