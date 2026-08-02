import { Percent } from "lucide-react"

import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { Badge } from "@/components/ui/badge"
import { monthsBetween } from "@/lib/apex/mortgage/amortization"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { cn } from "@/lib/utils"

import { EMERALD_ANCHOR, formatMonthYear, pluralMonths } from "./format"

/** What rate am I on, and when does the deal end? The remortgage alarm. */
export function RateCard({ mortgage }: { mortgage: Mortgage }) {
  const countdown = rateCountdown(mortgage.rateEndsOn)

  return (
    <ApexStatCard
      label="Rate"
      icon={Percent}
      iconClassName={cn(
        EMERALD_ANCHOR,
        countdown.state === "soon" &&
          "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
        countdown.state === "past" &&
          "bg-destructive/10 text-destructive dark:bg-destructive/20"
      )}
    >
      <div className="flex items-baseline gap-2">
        <ApexStatValue>{`${mortgage.interestRate.toFixed(2)}%`}</ApexStatValue>
        <Badge variant="outline" className="capitalize">
          {mortgage.rateType}
        </Badge>
      </div>
      <ApexStatHint
        className={cn(
          countdown.state === "soon" &&
            "font-medium text-amber-600 dark:text-amber-400",
          countdown.state === "past" && "font-medium text-destructive"
        )}
      >
        {countdown.text}
      </ApexStatHint>
    </ApexStatCard>
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
