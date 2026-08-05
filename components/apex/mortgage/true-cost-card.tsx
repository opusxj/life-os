import { Receipt } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import {
  monthlyRate,
  monthsBetween,
  overpaymentImpact,
  simulatePayoff,
} from "@/lib/apex/mortgage/amortization"
import { formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"

import { formatMonthYear, pluralMonths } from "./format"

/** The overpayment the verdict line prices: £100 a month, in pence. */
const EXTRA_MONTHLY = 10000

/**
 * What the rest of this mortgage costs in interest.
 *
 * The balance is the debt; this is the price of carrying it. Statements never
 * total it, and it's the number that turns "should I overpay?" from a vibe
 * into arithmetic, so the verdict line prices a £100 overpayment against it.
 */
export function TrueCostCard({
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
  // Interest-only never amortises, so "interest to payoff" has no end to sum
  // to. The honest figure is what standing still costs each year.
  if (mortgage.repaymentType === "interest_only") {
    const yearlyInterest = Math.round(
      status.balanceToday * (mortgage.interestRate / 100)
    )
    return (
      <Shell description="At today's rate" className={className}>
        <ApexStatValue>
          {formatPenceShort(yearlyInterest)}{" "}
          <ApexStatUnit>a year in interest</ApexStatUnit>
        </ApexStatValue>
        <ApexStatHint className="mt-1.5">
          The balance never falls, so this continues until the capital is
          repaid.
        </ApexStatHint>
      </Shell>
    )
  }

  // Part and part needs the interest-only portion to cost accurately, and the
  // entity doesn't carry it. A wrong total would be worse than none.
  if (mortgage.repaymentType === "part_and_part") {
    return (
      <Shell description="At today's payment and rate" className={className}>
        <ApexStatValue className="text-muted-foreground">—</ApexStatValue>
        <ApexStatHint className="mt-1.5">
          Part of this loan is interest only. Costing it needs the split, which
          isn&apos;t recorded.
        </ApexStatHint>
      </Shell>
    )
  }

  const projection = simulatePayoff(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment
  )

  if (!projection) {
    // Two very different reasons land here: the payment doesn't cover the
    // interest, or payoff sits beyond the simulation's century ceiling.
    // Say the right one; the first is a problem, the second only a long road.
    const coversInterest =
      mortgage.monthlyPayment >
      status.balanceToday * monthlyRate(mortgage.interestRate)
    return (
      <Shell description="At today's payment and rate" className={className}>
        <ApexStatValue className="text-muted-foreground">—</ApexStatValue>
        <ApexStatHint className="mt-1.5 font-medium text-destructive">
          {coversInterest
            ? `Payoff at this payment is more than a century away, so there is no total to show.`
            : `The payment doesn't cover the interest, so the total keeps growing.`}
        </ApexStatHint>
      </Shell>
    )
  }

  const impact = overpaymentImpact(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    EXTRA_MONTHLY
  )

  // When payoff runs past the contractual term end, say so: the runway chart
  // on the same page shows a balance still standing at the term, and the two
  // must tell one story.
  const termMonths = monthsBetween(
    new Date(`${today}T00:00:00`),
    new Date(`${mortgage.termEndsOn}T00:00:00`)
  )
  const monthsPastTerm = projection.months - termMonths

  return (
    <Shell
      description="If you run to payoff at today's payment and rate"
      className={className}
    >
      <ApexStatValue>
        {formatPenceShort(projection.totalInterest)}{" "}
        <ApexStatUnit>of interest to go</ApexStatUnit>
      </ApexStatValue>
      {monthsPastTerm > 0 && (
        <ApexStatHint className="mt-1.5 font-medium text-amber-600 dark:text-amber-400">
          {`That runs ${pluralMonths(monthsPastTerm)} past the ${formatMonthYear(mortgage.termEndsOn)} term end.`}
        </ApexStatHint>
      )}
      {impact && impact.interestSaved > 0 && impact.monthsSaved > 0 && (
        <ApexStatHint className={monthsPastTerm > 0 ? "mt-1" : "mt-1.5"}>
          {`${formatPenceShort(EXTRA_MONTHLY)} a month extra would save ${formatPenceShort(impact.interestSaved)} and bring payoff forward by ${pluralMonths(impact.monthsSaved)}.`}
        </ApexStatHint>
      )}
    </Shell>
  )
}

/** One shell for every state, so the card reads the same however it resolves. */
function Shell({
  description,
  className,
  children,
}: {
  description: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <ApexStatCard
      label="True cost"
      description={description}
      icon={Receipt}
      iconClassName={ANCHOR_TINTS.bill}
      className={className}
    >
      {children}
    </ApexStatCard>
  )
}
