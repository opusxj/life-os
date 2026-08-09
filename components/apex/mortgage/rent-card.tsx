import { HandCoins } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { MeterHead } from "@/components/apex/meter"
import { DataProgress } from "@/components/apex/progress"
import {
  ApexCardFootnote,
  ApexStatCard,
  ApexStatFigure,
  ApexStatTag,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { paymentSplit } from "@/lib/apex/mortgage/amortization"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"

import { formatShare } from "./format"

/**
 * What the rent costs, set against what the mortgage payment buys.
 *
 * On shared ownership you rent the half of the home you do not own, every
 * month, and nothing that money touches ever becomes yours. The page already
 * collected the figure and only ever showed it as a line item in the Monthly
 * cost table, where it reads as one bill among several. Put beside the part of
 * this month's payment that actually reduces the debt, it explains shared
 * ownership better than any other number here: more leaves for the half you do
 * not own than arrives in the half you do.
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

  // Read from the share itself, not from lendingBase: that returns null with no
  // property value, which says nothing about whether the home is shared. Taking
  // it from there told a shared owner with no valuation on file that the rent
  // was merely "recorded against this mortgage".
  const share = mortgage.equitySharePct
  const isShared = share !== null && share > 0 && share < 100

  const compare = equityBought(mortgage, status)

  return (
    <ApexStatCard
      label="Rent"
      description={
        isShared
          ? `On the ${formatShare(100 - share)}% of this home you don't own`
          : "Recorded against this mortgage"
      }
      icon={HandCoins}
      iconClassName={ANCHOR_TINTS.bill}
      className={className}
    >
      {/* The two periods of one figure, on one line: the monthly amount you
          pay and the yearly total it comes to. Stacked, the pill read as a
          second fact; side by side it reads as the same fact at a longer
          range, which is the whole reason it is here. */}
      <div className="flex items-baseline justify-between gap-3">
        <ApexStatValue>
          <ApexStatFigure>{formatPence(rent)}</ApexStatFigure>{" "}
          <ApexStatUnit>a month</ApexStatUnit>
        </ApexStatValue>
        <ApexStatTag tint="bill" className="shrink-0">
          {`${formatPenceShort(rent * 12)} a year`}
        </ApexStatTag>
      </div>

      {compare !== null && (
        // Two independent quantities compared, not parts of one whole, so they
        // get two labelled lengths rather than a third bar of the segment-meter
        // family in a row that already carries two. Both amounts are printed
        // beside their bars, which is why neither bar takes a tooltip.
        <div
          role="img"
          aria-label={`Rent takes ${formatPence(rent)} a month, while ${formatPence(compare)} of this month's mortgage payment buys you equity.`}
          className="mt-3.5 space-y-3.5"
        >
          <CompareRow
            label="Rent"
            amount={rent}
            longest={Math.max(rent, compare)}
            color="var(--color-sky-500)"
          />
          <CompareRow
            label="Buys you equity"
            amount={compare}
            longest={Math.max(rent, compare)}
            color="var(--color-emerald-500)"
          />
        </div>
      )}

      {/* Says why the rent exists and what moves it, rather than only what it
          fails to do. "None of it buys you a larger share" was true, but it
          raised the obvious next question and then went quiet, and it sat under
          a bar captioned "Buys you equity" where the pronoun read as a flat
          contradiction of the graphic.

          It names staircasing without pricing it, on purpose. The cost is
          derivable (a share of the property value, with the rent falling in
          proportion) but the lease terms that govern it are not on file: the
          minimum increment, whether full staircasing is even permitted, the
          landlord's valuation, the legal and lender fees, and the fact the
          money would come from a larger mortgage. Quoting a figure from what we
          hold would understate all of it. */}
      <ApexCardFootnote>
        {isShared
          ? `Rent is charged on your landlord's ${formatShare(100 - share)}%. Buying more of it, called staircasing, is what lowers it.`
          : "None of the rent reduces the mortgage."}
      </ApexCardFootnote>
    </ApexStatCard>
  )
}

/**
 * What this month's payment adds to your stake, or null when the card cannot
 * honestly draw it.
 *
 * part_and_part is the reason this is a function. paymentSplit only
 * special-cases interest_only, so a part-and-part loan comes back with the
 * whole of payment-minus-interest treated as capital, which it is not: the
 * entity does not carry the interest-only portion needed to split it. Drawing a
 * bar off that figure would be inventing the number, and the card this row
 * replaced refused the same trade for the same reason.
 */
function equityBought(
  mortgage: Mortgage,
  status: MortgageStatus
): number | null {
  if (mortgage.repaymentType !== "repayment") return null
  const { capital } = paymentSplit(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    mortgage.repaymentType
  )
  // Zero whenever the payment does not cover the interest, and a bar of length
  // nothing beside a full one is a worse answer than no comparison at all
  return capital > 0 ? capital : null
}

/**
 * One quantity: its name and amount on a line, its length underneath.
 *
 * DataProgress rather than a bar of this card's own, because "one length on a
 * full-width track" is the shape it already owns, and it settled the track
 * question the house way: a pastel step of the bar's own colour rather than
 * grey. A grey track would have been the only recessive region in this row that
 * sits darker than the card in dark mode, and would have put a fourth meaning
 * on bg-muted twelve pixels from the staircase that uses it for something else.
 */
function CompareRow({
  label,
  amount,
  longest,
  color,
}: {
  label: string
  amount: number
  /** The larger of the two amounts, so both bars share one scale */
  longest: number
  /** A CSS colour, so the track can be mixed from it */
  color: string
}) {
  return (
    <div>
      <MeterHead name={label} amount={formatPence(amount)} />
      <DataProgress value={(amount / longest) * 100} color={color} />
    </div>
  )
}
