import { Landmark } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { DataProgress } from "@/components/apex/progress"
import { formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"

import { UpdateBalancePopover } from "./update-balance-popover"

/** How much is left of the mortgage? */
export function BalanceCard({
  mortgage,
  className,
}: {
  mortgage: Mortgage
  className?: string
}) {
  const paidPct = Math.min(
    100,
    Math.max(
      0,
      ((mortgage.originalAmount - mortgage.balance) / mortgage.originalAmount) *
        100
    )
  )

  return (
    <ApexStatCard
      label="Balance"
      icon={Landmark}
      iconClassName={ANCHOR_TINTS.balance}
      className={className}
      footer={
        <UpdateBalancePopover
          mortgageId={mortgage.id}
          balance={mortgage.balance}
        />
      }
    >
      <ApexStatValue>{formatPenceShort(mortgage.balance)}</ApexStatValue>
      <DataProgress
        value={paidPct}
        color="#10b981"
        aria-label="Paid off"
        className="mt-2"
      />
      <ApexStatHint className="mt-1.5">
        {`${paidPct.toFixed(0)}% paid off of ${formatPenceShort(mortgage.originalAmount)}`}
      </ApexStatHint>
    </ApexStatCard>
  )
}
