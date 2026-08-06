import { CalendarRange } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import {
  monthsBetween,
  monthsFromNow,
} from "@/lib/apex/mortgage/amortization"
import { formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatMonthYear, pluralMonths } from "./format"

/** When is this actually paid off, versus the term on paper? */
export function PayoffCard({
  mortgage,
  status,
  today,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  /** yyyy-mm-dd resolved server-side, the same clock status was computed on */
  today: string
  className?: string
}) {
  const termEnd = formatMonthYear(mortgage.termEndsOn)

  // Interest-only and part-and-part never fully clear themselves: capital
  // falls due at the term end, so a payoff date would be an invention rather
  // than a projection. The two differ in how much falls due: interest-only is
  // the whole balance; part-and-part is an unknowable slice (the split isn't
  // stored), so that branch names no figure.
  if (status.lumpSumAtTerm) {
    return (
      <ApexStatCard
        label="Capital due"
        description="The term end on file"
        icon={CalendarRange}
        iconClassName={ANCHOR_TINTS.due}
        className={className}
      >
        <ApexStatValue>{termEnd}</ApexStatValue>
        <ApexStatHint className="mt-1.5">
          {mortgage.repaymentType === "interest_only"
            ? `${formatPenceShort(status.balanceToday)} falls due in full. Your payments cover the interest only.`
            : "Part of the balance falls due at the term end. Your payments repay only part of the capital."}
        </ApexStatHint>
      </ApexStatCard>
    )
  }

  if (status.monthsToFree === null) {
    return (
      <ApexStatCard
        label="Paid off"
        description="At today's payment and rate"
        icon={CalendarRange}
        iconClassName={ANCHOR_TINTS.due}
        className={className}
      >
        <ApexStatValue className="text-muted-foreground">
          Not on this payment
        </ApexStatValue>
        <ApexStatHint className="mt-1.5 font-medium text-destructive">
          {`The payment doesn't cover the interest, so the balance never clears.`}
        </ApexStatHint>
      </ApexStatCard>
    )
  }

  const projected = monthsFromNow(
    status.monthsToFree,
    new Date(`${today}T00:00:00`)
  )
  const delta = monthsBetween(
    projected,
    new Date(`${mortgage.termEndsOn}T00:00:00`)
  )

  return (
    <ApexStatCard
      label="Paid off"
      description="At today's payment and rate"
      icon={CalendarRange}
      iconClassName={ANCHOR_TINTS.due}
      className={className}
    >
      <ApexStatValue>{formatMonthYear(projected)}</ApexStatValue>
      {delta === 0 ? (
        <ApexStatHint className="mt-1.5">
          {`On track for the ${termEnd} term end`}
        </ApexStatHint>
      ) : (
        /* The delta rides under its value, signed, in the money colors:
           clearing the debt early is emerald, running past the term is red.
           The term-end month is named so the sign has a stated subject. */
        <p
          className={cn(
            "mt-1.5 text-[13px] font-medium tabular-nums",
            delta < 0
              ? "text-red-600 dark:text-red-400"
              : "text-emerald-600 dark:text-emerald-400"
          )}
        >
          {`${delta < 0 ? "+" : "-"}${pluralMonths(Math.abs(delta))} vs the ${termEnd} term end`}
        </p>
      )}
    </ApexStatCard>
  )
}
