import type { Mortgage } from "@/lib/apex/mortgage/queries"

import { formatShare } from "./format"
import { StatCard, StatSupport, StatValue } from "./stat-card"

/**
 * Shared ownership only: how much of the home is yours? Hidden entirely when
 * the share is null or 100 — a fully-owned mortgage has no second party.
 * Staircasing is just this number going up (apex.md decision #3).
 */
export function OwnershipCard({ mortgage }: { mortgage: Mortgage }) {
  const share = mortgage.equitySharePct
  if (share === null || share >= 100) return null

  return (
    <StatCard label="Ownership">
      <StatValue>{`You own ${formatShare(share)}%`}</StatValue>
      <div className="flex h-1.5 w-full gap-px overflow-hidden rounded-full">
        <div
          className="h-full rounded-l-full bg-emerald-500"
          style={{ width: `${share}%` }}
        />
        <div className="h-full flex-1 rounded-r-full bg-muted" />
      </div>
      <StatSupport>
        {`The housing association holds the other ${formatShare(100 - share)}%`}
      </StatSupport>
    </StatCard>
  )
}
