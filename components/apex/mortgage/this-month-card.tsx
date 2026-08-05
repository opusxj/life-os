import { Banknote } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatHint,
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
 * A statement shows the payment leaving and the balance falling, and never the
 * line between them. Early in a term most of a payment is rent on the debt, and
 * seeing that is what makes every later decision on this page make sense.
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
  const capitalPct = Math.round(
    (split.capital / Math.max(1, mortgage.monthlyPayment)) * 100
  )

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

      {/* Two parts of one payment, not progress toward a target, so this stays
          a custom two-segment bar rather than ui/Progress. */}
      <div
        aria-hidden
        className="mt-2.5 flex h-1.5 w-full gap-px overflow-hidden rounded-full"
      >
        <div
          className="h-full rounded-l-full bg-emerald-500"
          style={{ width: `${capitalPct}%` }}
        />
        <div className="h-full flex-1 rounded-r-full bg-amber-500/70" />
      </div>

      <ApexStatHint className="mt-2">{verdict(split, capitalPct)}</ApexStatHint>
    </ApexStatCard>
  )
}

function verdict(
  split: ReturnType<typeof paymentSplit>,
  capitalPct: number
): string {
  if (split.shortfall > 0) {
    return `The payment is ${formatPence(split.shortfall)} short of the interest, so the balance is growing.`
  }
  if (split.capital === 0) {
    return `All of it is interest. The capital is due in full at the end of the term.`
  }
  return `${formatPence(split.interest)} of it is interest. ${capitalPct}% builds equity.`
}
