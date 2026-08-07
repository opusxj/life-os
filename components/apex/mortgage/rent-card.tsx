import { HandCoins } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatFigure,
  ApexStatHint,
  ApexStatTag,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { paymentSplit } from "@/lib/apex/mortgage/amortization"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { lendingBase, type MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatShare } from "./format"

/**
 * What the rent costs, set against what the mortgage payment buys.
 *
 * On shared ownership you rent the half of the home you do not own, every
 * month, forever, and nothing that money touches ever becomes yours. The page
 * already collected the figure and only ever showed it as a line item in the
 * Monthly cost table, where it reads as one bill among several. Put beside the
 * part of this month's payment that actually reduces the debt, it explains
 * shared ownership better than any other number on the page.
 */
export function RentCard({
  mortgage,
  status,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  className?: string
}) {
  // Most mortgages carry no rent at all, and the row is designed to lose a
  // card rather than render an empty one.
  const rent = mortgage.rentMonthly
  if (rent === null || rent <= 0) return null

  // lendingBase returns null when there is no property value, which only means
  // there is no share to name. The rent is still real, so the provenance line
  // falls back to saying where the figure came from.
  const lending = lendingBase(mortgage)
  const shared = lending?.shared ? lending : null

  const capital = paymentSplit(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    mortgage.repaymentType
  ).capital

  const yearly = formatPenceShort(rent * 12)
  const longest = Math.max(rent, capital)

  return (
    <ApexStatCard
      label="Rent"
      description={
        shared
          ? `On the ${formatShare(100 - shared.share)}% of this home you don't own`
          : "Recorded against this mortgage"
      }
      icon={HandCoins}
      iconClassName={ANCHOR_TINTS.bill}
      className={className}
    >
      <ApexStatValue>
        <ApexStatFigure>{formatPence(rent)}</ApexStatFigure>{" "}
        <ApexStatUnit>a month</ApexStatUnit>
      </ApexStatValue>

      {capital > 0 ? (
        // Two independent quantities compared, not parts of one whole, so they
        // get two labelled lengths rather than a third bar of the segment-meter
        // family in a row that already carries one. Both amounts are printed
        // beside their bars, which is why neither bar takes a tooltip.
        <div
          role="img"
          aria-label={`Rent takes ${formatPence(rent)} a month, while ${formatPence(capital)} of this month's mortgage payment buys you equity.`}
          className="mt-3.5 space-y-2.5"
        >
          <CompareRow
            label="Rent"
            amount={rent}
            longest={longest}
            barClassName="bg-sky-500"
          />
          <CompareRow
            label="Buys you equity"
            amount={capital}
            longest={longest}
            barClassName="bg-emerald-500"
          />
        </div>
      ) : (
        // Interest-only never repays capital, so there is no second length to
        // draw against. The yearly total is the fact left worth carrying.
        <ApexStatTag tint="bill" className="mt-3">
          {`${yearly} a year`}
        </ApexStatTag>
      )}

      <ApexStatHint className="mt-3">
        {shared
          ? `${yearly} a year, and none of it buys you a larger share of the home.`
          : `${yearly} a year, and none of it reduces the mortgage.`}
      </ApexStatHint>
    </ApexStatCard>
  )
}

/** One quantity: its name and amount on a line, its length underneath. */
function CompareRow({
  label,
  amount,
  longest,
  barClassName,
}: {
  label: string
  amount: number
  /** The larger of the two amounts, so both bars share one scale */
  longest: number
  barClassName: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <span className="text-[13px] font-medium tabular-nums">
          {formatPence(amount)}
        </span>
      </div>
      <div
        className={cn("mt-1 h-2.5 rounded-full", barClassName)}
        style={{ width: `${(amount / longest) * 100}%` }}
      />
    </div>
  )
}
