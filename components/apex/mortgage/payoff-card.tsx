import {
  monthsBetween,
  monthsFromNow,
  simulatePayoff,
} from "@/lib/apex/mortgage/amortization"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { cn } from "@/lib/utils"

import { formatMonthYear, pluralMonths } from "./format"
import { StatCard, StatSupport, StatValue } from "./stat-card"

/** When is this actually paid off, versus the term on paper? */
export function PayoffCard({ mortgage }: { mortgage: Mortgage }) {
  const projection = simulatePayoff(
    mortgage.balance,
    mortgage.interestRate,
    mortgage.monthlyPayment
  )

  if (!projection) {
    return (
      <StatCard label="Payoff trajectory">
        <StatValue className="text-muted-foreground">—</StatValue>
        <StatSupport className="font-medium text-destructive">
          {`The payment doesn't cover the interest`}
        </StatSupport>
      </StatCard>
    )
  }

  const projected = monthsFromNow(projection.months)
  const delta = monthsBetween(
    projected,
    new Date(`${mortgage.termEndsOn}T00:00:00`)
  )
  const termEnd = formatMonthYear(mortgage.termEndsOn)

  return (
    <StatCard label="Payoff trajectory">
      <StatValue>{formatMonthYear(projected)}</StatValue>
      <StatSupport
        className={cn(
          delta > 0 && "font-medium text-emerald-600 dark:text-emerald-400",
          delta < 0 && "font-medium text-amber-600 dark:text-amber-400"
        )}
      >
        {delta === 0
          ? `On track for the ${termEnd} term end`
          : delta > 0
            ? `${pluralMonths(delta)} ahead of the ${termEnd} term end`
            : `${pluralMonths(-delta)} behind the ${termEnd} term end`}
      </StatSupport>
    </StatCard>
  )
}
