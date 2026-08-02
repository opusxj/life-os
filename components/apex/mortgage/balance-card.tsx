import { Landmark } from "lucide-react"

import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { DataProgress } from "@/components/apex/progress"
import type { Mortgage } from "@/lib/apex/mortgage/queries"

import { EMERALD_ANCHOR, formatPounds } from "./format"
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
    <ApexStatCard
      label="Balance"
      icon={Landmark}
      iconClassName={EMERALD_ANCHOR}
      footer={
        <UpdateBalancePopover
          mortgageId={mortgage.id}
          balance={mortgage.balance}
        />
      }
    >
      <ApexStatValue>{formatPounds(mortgage.balance)}</ApexStatValue>
      <DataProgress
        value={paidPct}
        color="#10b981"
        aria-label="Paid off"
        className="mt-2"
      />
      <ApexStatHint className="mt-1.5">
        {`${paidPct.toFixed(0)}% paid off of ${formatPounds(mortgage.originalAmount)}`}
      </ApexStatHint>
    </ApexStatCard>
  )
}
