import type { Mortgage } from "@/lib/apex/mortgage/queries"

import { formatPounds } from "./format"
import { StatCard, StatSupport, StatValue } from "./stat-card"
import { UpdateBalancePopover } from "./update-balance-popover"

/** How much is left of the mortgage? */
export function BalanceCard({ mortgage }: { mortgage: Mortgage }) {
  const paidPct = Math.min(
    100,
    Math.max(
      0,
      ((mortgage.originalAmount - mortgage.balance) / mortgage.originalAmount) *
        100
    )
  )

  return (
    <StatCard
      label="Balance"
      action={
        <UpdateBalancePopover
          mortgageId={mortgage.id}
          balance={mortgage.balance}
        />
      }
    >
      <StatValue>{formatPounds(mortgage.balance)}</StatValue>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${paidPct}%` }}
        />
      </div>
      <StatSupport>
        {`${paidPct.toFixed(0)}% paid off of ${formatPounds(mortgage.originalAmount)}`}
      </StatSupport>
    </StatCard>
  )
}
