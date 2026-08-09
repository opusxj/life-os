import { Banknote } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { MeterSwatch, SegmentMeter } from "@/components/apex/meter"
import { ApexStatCard } from "@/components/apex/stat-card"
import {
  monthsFromNow,
  monthsToCapitalMajority,
  paymentSplit,
} from "@/lib/apex/mortgage/amortization"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"

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
  const note = edgeNote(mortgage, status, split)
  // Walks the balance forward, so resolve it once rather than per JSX branch
  const crossoverLine = crossover(mortgage, status, split, today)

  return (
    <ApexStatCard
      label="Payment split"
      description={`Where this month's ${formatPence(mortgage.monthlyPayment)} goes`}
      icon={Banknote}
      iconClassName={ANCHOR_TINTS.bill}
      className={className}
    >
      <p className="text-base font-medium">{headline(split)}</p>
      {note && <p className="mt-1 text-[13px] text-muted-foreground">{note}</p>}

      {split.shortfall === 0 && (
        <>
          <SegmentMeter
            className="mt-4"
            label={`${formatPence(split.capital)} of the payment reduces your debt; ${formatPence(split.interest)} is interest.`}
            segments={[
              {
                pct: capitalPct,
                className: "bg-emerald-500",
                tip: `${capitalPct}% clears the mortgage`,
              },
              {
                pct: 100 - capitalPct,
                className: "bg-amber-500/70",
                tip: `${100 - capitalPct}% interest paid`,
              },
            ]}
          />
          {/* The amounts sit under their own ends of the bar, tying the two
              figures in the copy above to the runs that represent them; the
              share each one is stays a hover away. */}
          <div className="mt-2 flex items-center justify-between text-[12px] text-muted-foreground tabular-nums">
            <span className="flex items-center gap-1.5">
              <MeterSwatch className="bg-emerald-500" />
              {formatPence(split.capital)}
            </span>
            <span className="flex items-center gap-1.5">
              <MeterSwatch className="bg-amber-500/70" />
              {formatPence(split.interest)}
            </span>
          </div>
        </>
      )}

      {/* Settles at the card's base: mt-auto takes the slack, pt-4 keeps a
          minimum gap when there is none to take. A hairline is all the
          separation this needs, since a filled strip is what the footer slot
          uses for actions and prose in one miscues as a toolbar. */}
      {crossoverLine && (
        <div className="mt-auto pt-4">
          <p className="border-t pt-3 text-[12px] leading-snug text-muted-foreground">
            {crossoverLine}
          </p>
        </div>
      )}

    </ApexStatCard>
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

/**
 * Only the states the graphic cannot show. A healthy split needs no prose:
 * the interest figure sits under its own end of the bar, and the balance and
 * rate that set it belong to the Balance card and the hero. Saying them again
 * here was repetition wearing the clothes of an explanation.
 */
function edgeNote(
  mortgage: Mortgage,
  status: MortgageStatus,
  split: ReturnType<typeof paymentSplit>
): string | null {
  const on = `your ${formatPenceShort(status.balanceToday)} balance at ${mortgage.interestRate}%`

  if (split.shortfall > 0) {
    return `Interest on ${on} is ${formatPence(split.interest + split.shortfall)} a month, so the balance is growing by ${formatPence(split.shortfall)}.`
  }
  if (split.capital === 0) {
    return `All ${formatPence(mortgage.monthlyPayment)} is interest on ${on}. The capital is due in full at the end of the term.`
  }
  return null
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
