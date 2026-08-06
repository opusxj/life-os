import { Banknote } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { SegmentMeter } from "@/components/apex/meter"
import { ApexStatCard } from "@/components/apex/stat-card"
import {
  monthsFromNow,
  monthsToCapitalMajority,
  paymentSplit,
} from "@/lib/apex/mortgage/amortization"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatMonthYear } from "./format"

/**
 * Where this month's payment actually goes.
 *
 * A statement shows the payment leaving and the balance falling, and never
 * the line between them. Early in a term most of a payment is rent on the
 * debt, and seeing that is what makes every later decision on this page make
 * sense. The crossover line gives the ratio a date, which is the difference
 * between a fact and a story.
 */
export function ThisMonthCard({
  mortgage,
  status,
  today,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  /** yyyy-mm-dd resolved server-side so SSR and hydration agree */
  today: string
  className?: string
}) {
  const split = paymentSplit(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    mortgage.repaymentType
  )
  const payment = Math.max(1, mortgage.monthlyPayment)
  const capitalPct = Math.round((split.capital / payment) * 100)
  // Walks the balance forward, so resolve it once rather than per JSX branch
  const crossoverLine = crossover(mortgage, status, split, today)

  return (
    <ApexStatCard
      label="This month"
      description={`Where your ${formatPence(mortgage.monthlyPayment)} payment goes`}
      icon={Banknote}
      iconClassName={ANCHOR_TINTS.bill}
      className={className}
    >
      <p className="text-base font-medium">{headline(split)}</p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {mechanism(mortgage, status, split)}
      </p>

      {split.shortfall === 0 && (
        <>
          <SegmentMeter
            className="mt-4"
            label={`${formatPence(split.capital)} of the payment reduces your debt; ${formatPence(split.interest)} is interest.`}
            segments={[
              {
                pct: capitalPct,
                className: "bg-emerald-500",
                tip: `${formatPence(split.capital)} this month`,
              },
              {
                pct: 100 - capitalPct,
                className: "bg-amber-500/70",
                tip: `${formatPence(split.interest)} this month`,
              },
            ]}
          />
          {/* Each key sits at its own end of the bar, so the swatch points at
              the run it names instead of floating in a detached legend row. */}
          <div className="mt-2 flex items-center justify-between text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Swatch className="bg-emerald-500" />
              {`${capitalPct}% reduces debt`}
            </span>
            <span className="flex items-center gap-1.5">
              <Swatch className="bg-amber-500/70" />
              {`${100 - capitalPct}% interest`}
            </span>
          </div>
        </>
      )}

      {crossoverLine && (
        <p className="mt-3 text-[13px] text-muted-foreground">
          {crossoverLine}
        </p>
      )}
    </ApexStatCard>
  )
}

function Swatch({ className }: { className: string }) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-[3px]", className)}
    />
  )
}

/** The lead: how little of the payment does the work you care about. */
function headline(split: ReturnType<typeof paymentSplit>): React.ReactNode {
  if (split.shortfall > 0) return "Your payment doesn't cover the interest"
  if (split.capital === 0) return "None of it reduces what you owe"
  return (
    <>
      Only{" "}
      <span className="text-emerald-600 tabular-nums dark:text-emerald-400">
        {formatPence(split.capital)}
      </span>{" "}
      reduces what you owe
    </>
  )
}

/** Why the split is what it is: the balance and the rate that set it. */
function mechanism(
  mortgage: Mortgage,
  status: MortgageStatus,
  split: ReturnType<typeof paymentSplit>
): string {
  const on = `your ${formatPenceShort(status.balanceToday)} balance at ${mortgage.interestRate}%`

  if (split.shortfall > 0) {
    return `Interest on ${on} is ${formatPence(split.interest + split.shortfall)} a month, so the balance is growing by ${formatPence(split.shortfall)}.`
  }
  if (split.capital === 0) {
    return `All ${formatPence(mortgage.monthlyPayment)} is interest on ${on}. The capital is due in full at the end of the term.`
  }
  return `The other ${formatPence(split.interest)} is interest on ${on}.`
}

/** The ratio with a date on it, and only when the date says something. */
function crossover(
  mortgage: Mortgage,
  status: MortgageStatus,
  split: ReturnType<typeof paymentSplit>,
  today: string
): string | null {
  if (split.shortfall > 0 || split.capital === 0) return null

  const months = monthsToCapitalMajority(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment
  )
  if (months === null) return null
  if (months === 0) {
    return "More than half of every payment now reduces the debt."
  }

  const when = formatMonthYear(
    monthsFromNow(months, new Date(`${today}T00:00:00`))
  )
  return `Half your payment won't reduce the debt until ${when}.`
}
