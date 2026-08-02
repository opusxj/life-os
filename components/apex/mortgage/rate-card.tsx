import { Badge } from "@/components/ui/badge"
import { monthsBetween } from "@/lib/apex/mortgage/amortization"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { cn } from "@/lib/utils"

import { formatMonthYear, pluralMonths } from "./format"
import { StatCard, StatSupport, StatValue } from "./stat-card"

/** What rate am I on, and when does the deal end? The remortgage alarm. */
export function RateCard({ mortgage }: { mortgage: Mortgage }) {
  const countdown = rateCountdown(mortgage.rateEndsOn)

  return (
    <StatCard label="Rate">
      <div className="flex items-baseline gap-2">
        <StatValue>{`${mortgage.interestRate.toFixed(2)}%`}</StatValue>
        <Badge variant="secondary" className="capitalize">
          {mortgage.rateType}
        </Badge>
      </div>
      <StatSupport
        className={cn(
          countdown.state === "soon" &&
            "font-medium text-amber-600 dark:text-amber-400",
          countdown.state === "past" && "font-medium text-destructive"
        )}
      >
        {countdown.text}
      </StatSupport>
    </StatCard>
  )
}

function rateCountdown(rateEndsOn: string | null): {
  state: "none" | "ok" | "soon" | "past"
  text: string
} {
  if (!rateEndsOn) return { state: "none", text: `No fixed end` }

  const months = monthsBetween(new Date(), new Date(`${rateEndsOn}T00:00:00`))
  const when = formatMonthYear(rateEndsOn)

  if (months < 0) {
    return { state: "past", text: `Rate ended ${when} — time to remortgage` }
  }
  if (months === 0) {
    return { state: "soon", text: `Ends this month · ${when}` }
  }
  return {
    state: months < 6 ? "soon" : "ok",
    text: `Ends in ${pluralMonths(months)} · ${when}`,
  }
}
