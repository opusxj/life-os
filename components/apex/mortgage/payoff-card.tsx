import { CalendarRange } from "lucide-react"

import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import {
  monthsBetween,
  monthsFromNow,
  simulatePayoff,
} from "@/lib/apex/mortgage/amortization"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { cn } from "@/lib/utils"

import { formatMonthYear, pluralMonths } from "./format"

/** When is this actually paid off, versus the term on paper? */
export function PayoffCard({ mortgage }: { mortgage: Mortgage }) {
  const projection = simulatePayoff(
    mortgage.balance,
    mortgage.interestRate,
    mortgage.monthlyPayment
  )

  if (!projection) {
    return (
      <ApexStatCard label="Payoff trajectory" icon={CalendarRange}>
        <ApexStatValue className="text-muted-foreground">—</ApexStatValue>
        <ApexStatHint className="font-medium text-destructive">
          {`The payment doesn't cover the interest`}
        </ApexStatHint>
      </ApexStatCard>
    )
  }

  const projected = monthsFromNow(projection.months)
  const delta = monthsBetween(
    projected,
    new Date(`${mortgage.termEndsOn}T00:00:00`)
  )
  const termEnd = formatMonthYear(mortgage.termEndsOn)

  return (
    <ApexStatCard label="Payoff trajectory" icon={CalendarRange}>
      <ApexStatValue>{formatMonthYear(projected)}</ApexStatValue>
      <ApexStatHint
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
      </ApexStatHint>
    </ApexStatCard>
  )
}
