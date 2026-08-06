import { Banknote } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { SegmentMeter } from "@/components/apex/meter"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatTag,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { paymentSplit } from "@/lib/apex/mortgage/amortization"
import { formatPence } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"

/**
 * Where this month's payment actually goes.
 *
 * A statement shows the payment leaving and the balance falling, and never
 * the line between them. Early in a term most of a payment is rent on the
 * debt, and seeing that is what makes every later decision on this page make
 * sense.
 */
export function ThisMonthCard({
  mortgage,
  status,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  className?: string
}) {
  const split = paymentSplit(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    mortgage.repaymentType
  )
  const payment = Math.max(1, mortgage.monthlyPayment)
  const capitalPct = Math.round((split.capital / payment) * 100)
  const interestPct = Math.round((split.interest / payment) * 100)

  return (
    <ApexStatCard
      label="This month"
      description={`Where your ${formatPence(mortgage.monthlyPayment)} payment goes`}
      icon={Banknote}
      iconClassName={ANCHOR_TINTS.bill}
      className={className}
    >
      <ApexStatValue>
        {formatPence(split.capital)}{" "}
        <ApexStatUnit>{`of ${formatPence(mortgage.monthlyPayment)}`}</ApexStatUnit>
      </ApexStatValue>

      <SegmentMeter
        className="mt-3"
        label={`${formatPence(split.capital)} of the payment clears debt; ${formatPence(split.interest)} is interest.`}
        segments={[
          {
            pct: capitalPct,
            className: "bg-emerald-500",
            tip: `${formatPence(split.capital)} clears debt and becomes equity.`,
          },
          {
            pct: interestPct,
            className: "bg-amber-500/70",
            tip: `${formatPence(split.interest)} is interest, the cost of borrowing.`,
          },
        ]}
      />

      {split.shortfall > 0 || split.capital === 0 ? (
        <ApexStatHint className="mt-3">{edgeVerdict(split)}</ApexStatHint>
      ) : (
        <div className="mt-3">
          <ApexStatTag tint="balance">{`${capitalPct}% builds equity`}</ApexStatTag>
        </div>
      )}
    </ApexStatCard>
  )
}

function edgeVerdict(split: ReturnType<typeof paymentSplit>): string {
  if (split.shortfall > 0) {
    return `The payment is ${formatPence(split.shortfall)} short of the interest, so the balance is growing.`
  }
  return `All of it is interest. The capital is due in full at the end of the term.`
}
