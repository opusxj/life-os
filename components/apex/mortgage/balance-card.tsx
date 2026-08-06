import { Landmark } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { ArcGauge } from "@/components/apex/arc-gauge"
import { ApexStatCard, ApexStatTag } from "@/components/apex/stat-card"
import { formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"

import { formatDayMonth } from "./format"
import { UpdateBalancePopover } from "./update-balance-popover"

/**
 * How much is left, and how far through it that puts you. The one card whose
 * whole point is the proportion, so it carries the feature arc; everything
 * else uses the meter display.
 */
export function BalanceCard({
  mortgage,
  status,
  today,
  quickAction,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  /** yyyy-mm-dd resolved server-side */
  today: string
  /** Only when the page bar can't own the action, which is at two or more
   *  mortgages: one button up there beats one on every card. */
  quickAction?: boolean
  className?: string
}) {
  const balance = status.balanceToday
  const paidPct = Math.min(
    100,
    Math.max(
      0,
      ((mortgage.originalAmount - balance) / mortgage.originalAmount) * 100
    )
  )

  return (
    <ApexStatCard
      label="Balance"
      description={provenance(mortgage.balanceAsOf, status.monthsSinceBalance)}
      icon={Landmark}
      iconClassName={ANCHOR_TINTS.balance}
      className={className}
      footer={
        quickAction ? (
          <UpdateBalancePopover
            mortgageId={mortgage.id}
            balance={mortgage.balance}
            balanceAsOf={mortgage.balanceAsOf}
            today={today}
          />
        ) : undefined
      }
    >
      <ArcGauge
        value={paidPct}
        label={formatPenceShort(balance)}
        caption="still owed"
        className="mt-1"
      />
      <div className="mt-3 flex justify-center">
        <ApexStatTag tint="balance">
          {`${formatPenceShort(mortgage.originalAmount - balance)} paid of ${formatPenceShort(mortgage.originalAmount)}`}
        </ApexStatTag>
      </div>
    </ApexStatCard>
  )
}

/**
 * Interest-only balances never move, so "projected" would overclaim. For
 * everything else the figure shown is the statement aged forward, and saying
 * so is the difference between a number you can trust and one you have to
 * check. "Since" only where time has actually been applied to the figure.
 */
function provenance(balanceAsOf: string, monthsSince: number): string {
  const date = formatDayMonth(balanceAsOf)
  return monthsSince > 0
    ? `Projected since your ${date} statement`
    : `From your ${date} statement`
}
