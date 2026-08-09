import { TrendingUp } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexCardFootnote,
  ApexStatCard,
  ApexStatFigure,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { formatDayMonth } from "@/lib/apex/dates"
import { formatPence } from "@/lib/apex/money"
import type { PriceRiser } from "@/lib/apex/subscriptions/history"
import { annualPence } from "@/lib/apex/subscriptions/queries"

/**
 * The quiet rises, named. Subscriptions and bills drift upward a pound at a
 * time and nobody announces it; this card compares each item's current price
 * against the first price ever paid for it (Mark paid's stamps), which is
 * history the app already owns. Rows carry the story in the item's own
 * billing unit; the hero and deltas speak per month, the card's one base.
 * With no risers the card never renders, and the months-ahead card takes the
 * row back — no news is the good state, not a grey card.
 */
export function PriceCreepCard({
  risers,
  className,
}: {
  /** From priceRisers — biggest monthly delta first */
  risers: PriceRiser[]
  className?: string
}) {
  if (risers.length === 0) return null

  const totalMonthly = risers.reduce((sum, riser) => sum + riser.deltaMonthly, 0)
  const totalAnnual = risers.reduce(
    (sum, riser) =>
      sum +
      annualPence(riser.toAmount, riser.cadence) -
      annualPence(riser.fromAmount, riser.cadence),
    0
  )

  return (
    <ApexStatCard
      label="Price creep"
      description="Each price against the first one you paid"
      icon={TrendingUp}
      iconClassName={ANCHOR_TINTS.bill}
      className={className}
    >
      <ApexStatValue>
        <ApexStatFigure>{formatPence(totalMonthly)}</ApexStatFigure>{" "}
        <ApexStatUnit>a month more</ApexStatUnit>
      </ApexStatValue>

      <div className="mt-2 space-y-2.5">
        {risers.map((riser) => (
          <div key={riser.id}>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate">{riser.name}</span>
              <span className="shrink-0 font-medium text-red-600 tabular-nums dark:text-red-400">
                {`+${formatPence(riser.deltaMonthly)}`}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
              {`${formatPence(riser.fromAmount)} to ${formatPence(riser.toAmount)}, ${riser.story.kind} ${formatDayMonth(riser.story.on)}`}
            </p>
          </div>
        ))}
      </div>

      <ApexCardFootnote>
        {`${formatPence(totalAnnual)} a year at the new prices.`}
      </ApexCardFootnote>
    </ApexStatCard>
  )
}
