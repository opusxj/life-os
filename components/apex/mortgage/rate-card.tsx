import { Percent } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { Badge } from "@/components/ui/badge"
import { monthsBetween } from "@/lib/apex/mortgage/amortization"
import type { Mortgage } from "@/lib/apex/mortgage/queries"

import { formatMonthYear, pluralMonths } from "./format"

/** What rate am I on, and when does the deal end? The remortgage alarm. */
export function RateCard({ mortgage }: { mortgage: Mortgage }) {
  const countdown = rateCountdown(mortgage.rateEndsOn)
  const rate = `${mortgage.interestRate.toFixed(2)}%`
  const typeBadge = (
    <Badge variant="outline" className="capitalize">
      {mortgage.rateType}
    </Badge>
  )

  // Alarm inversion: once the deal is ending, the time left IS the answer —
  // the rate itself drops into the hint line.
  if (countdown.state === "soon" || countdown.state === "past") {
    const past = countdown.state === "past"
    return (
      <ApexStatCard
        label="Rate"
        icon={Percent}
        iconClassName={ANCHOR_TINTS.due}
      >
        <div className="flex items-baseline gap-2">
          <ApexStatValue
            className={
              past ? "text-destructive" : "text-amber-600 dark:text-amber-400"
            }
          >
            {past
              ? `Rate ended`
              : countdown.months === 0
                ? `This month`
                : pluralMonths(countdown.months)}
          </ApexStatValue>
          {past ? (
            <Badge variant="destructive">Remortgage</Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
            >
              Ends soon
            </Badge>
          )}
        </div>
        <ApexStatHint className="flex items-center gap-1.5">
          <span className="tabular-nums">{rate}</span>
          {typeBadge}
          <span>{`· ${past ? "ended" : "ends"} ${countdown.when}`}</span>
        </ApexStatHint>
      </ApexStatCard>
    )
  }

  return (
    <ApexStatCard label="Rate" icon={Percent}>
      <div className="flex items-baseline gap-2">
        <ApexStatValue>{rate}</ApexStatValue>
        {typeBadge}
      </div>
      <ApexStatHint>
        {countdown.state === "none"
          ? `No fixed end`
          : `Ends in ${pluralMonths(countdown.months)} · ${countdown.when}`}
      </ApexStatHint>
    </ApexStatCard>
  )
}

type RateCountdown =
  | { state: "none" }
  | { state: "ok" | "soon" | "past"; months: number; when: string }

function rateCountdown(rateEndsOn: string | null): RateCountdown {
  if (!rateEndsOn) return { state: "none" }

  const months = monthsBetween(new Date(), new Date(`${rateEndsOn}T00:00:00`))
  const when = formatMonthYear(rateEndsOn)
  const state = months < 0 ? "past" : months < 6 ? "soon" : "ok"
  return { state, months, when }
}
