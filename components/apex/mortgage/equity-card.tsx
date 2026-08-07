import { Sprout } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { MeterHead, SegmentMeter } from "@/components/apex/meter"
import {
  ApexStatCard,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { projectBalance } from "@/lib/apex/mortgage/amortization"
import { formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { lendingBase, type MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatMonthYear, formatShare } from "./format"

/**
 * How much of this home is actually yours.
 *
 * Drawn as two bars, not one, because one could not show the thing the card is
 * about. Measured against the whole property a £12,650 stake is 4.1%, which on
 * a card-width track is a twelve-pixel dot: the two slices that dominated the
 * graphic were both the ones that are not yours. Nesting the question fixes
 * that without inflating anything. The first bar answers "how much of this
 * home am I buying", the second answers "and how much of that is mine yet",
 * where the same stake is 8.2% and legible.
 *
 * It is also the mental model shared ownership actually has. A 50% share reads
 * to a first-time buyer as owning half the place, and the second bar is where
 * that turns out to mean something narrower.
 *
 * Sole ownership drops the first bar rather than drawing a full one: there is
 * no landlord to divide off, so the card is simply the second question.
 */
export function EquityCard({
  mortgage,
  status,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  className?: string
}) {
  // No valuation, no stake to size. The Loan to value card owns the prompt.
  const propertyValue = mortgage.propertyValue
  const lending = lendingBase(mortgage)
  if (propertyValue === null || propertyValue <= 0 || lending === null) {
    return null
  }
  const { value: shareValue, shared: isShared, share } = lending

  const balance = status.balanceToday
  const equity = shareValue - balance
  // Clamped so negative equity never paints past the end of its own bar
  const outright = Math.max(0, equity)
  const mortgaged = Math.min(balance, shareValue)

  const ahead = equityAhead(mortgage, status, shareValue, equity)

  return (
    <ApexStatCard
      label="Equity"
      description={`Your stake in a ${formatPenceShort(propertyValue)} home`}
      icon={Sprout}
      iconClassName={ANCHOR_TINTS.property}
      className={className}
    >
      <ApexStatValue>
        {formatPenceShort(Math.abs(equity))}{" "}
        <ApexStatUnit>
          {equity >= 0
            ? "is yours"
            : isShared
              ? "short of your share's value"
              : "short of the home's value"}
        </ApexStatUnit>
      </ApexStatValue>

      {/* The one figure on this page that rises. Everything else here counts
          down, so the direction is worth a line of its own. */}
      {ahead && (
        <p className="mt-1 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
          {ahead}
        </p>
      )}

      {isShared && (
        <>
          <MeterHead
            className="mt-3.5"
            name="The home"
            amount={formatPenceShort(propertyValue)}
          />
          <SegmentMeter
            label={`Of the ${formatPenceShort(propertyValue)} home, your ${formatShare(share)}% share is worth ${formatPenceShort(shareValue)} and your landlord holds the rest.`}
            segments={[
              {
                pct: (shareValue / propertyValue) * 100,
                className: "bg-emerald-500/45 dark:bg-emerald-500/50",
                tip: `Your ${formatShare(share)}% share, ${formatPenceShort(shareValue)}`,
              },
              {
                pct: ((propertyValue - shareValue) / propertyValue) * 100,
                className: "bg-muted-foreground/20",
                tip: `Landlord's ${formatShare(100 - share)}%, ${formatPenceShort(propertyValue - shareValue)}`,
              },
            ]}
          />
        </>
      )}

      {/* Second bar, second scale: this one is a hundred percent of your share,
          which is why the stake is finally big enough to see. */}
      <MeterHead
        className="mt-3.5"
        name={isShared ? `Your ${formatShare(share)}% of it` : "The home"}
        amount={formatPenceShort(shareValue)}
      />
      <SegmentMeter
        label={`Of that ${formatPenceShort(shareValue)}, ${formatPenceShort(outright)} is yours outright and ${formatPenceShort(mortgaged)} is still mortgaged.`}
        segments={[
          {
            pct: (outright / shareValue) * 100,
            className: "bg-emerald-500",
            tip: `${formatPenceShort(outright)} yours outright`,
          },
          {
            pct: (mortgaged / shareValue) * 100,
            className: "bg-emerald-500/20 dark:bg-emerald-500/25",
            tip: `${formatPenceShort(mortgaged)} still mortgaged`,
          },
        ]}
      />

      <div className="mt-auto pt-4">
        <p
          className={cn(
            "border-t pt-3 text-[12px] leading-snug text-muted-foreground",
            equity < 0 && "font-medium text-destructive"
          )}
        >
          {closing(equity, outright, shareValue, propertyValue, isShared, share)}
        </p>
      </div>
    </ApexStatCard>
  )
}

/**
 * How much the stake grows before the deal ends.
 *
 * Measured at the deal end and not one month further, which is the same anchor
 * the Loan to value card uses and for the same reason: past that date the rate
 * changes, and a projection walked through it reports a number the loan never
 * reaches.
 *
 * Repayment only. Interest only never repays capital, so the stake does not
 * move. part_and_part is the subtler one: projectBalance treats it as full
 * repayment (amortization.ts says so in terms), which understates the balance
 * and therefore overstates this growth. The Rent card beside this one already
 * refuses to price part-and-part for the same reason, and one row cannot
 * suppress a figure on one card and print the optimistic version on the next.
 */
function equityAhead(
  mortgage: Mortgage,
  status: MortgageStatus,
  shareValue: number,
  equity: number
): string | null {
  if (mortgage.repaymentType !== "repayment") return null
  const months = status.monthsToRateEnd
  if (months === null || months <= 0 || !mortgage.rateEndsOn) return null

  const then = projectBalance(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    months,
    mortgage.repaymentType
  )
  // Whole pounds: this is a projection, and "+£1,729.91" claims a precision to
  // the penny that seven months of arithmetic does not have.
  const growth = Math.round((shareValue - then - equity) / 100) * 100
  if (growth <= 0) return null

  return `+${formatPenceShort(growth)} by ${formatMonthYear(mortgage.rateEndsOn)}, when your deal ends`
}

/**
 * What the two bars show but never state: the stake as a proportion, of the
 * share and of the whole house. Both are worth saying, because the gap between
 * them is exactly the thing "a 50% share" hides.
 *
 * Says "outright" because without it the line contradicts the bar directly
 * above it, which is headed "Your 50% of it": you do own the whole share, and
 * what this counts is the part of it no longer standing against a debt. It also
 * names its own subject rather than opening on "That is", which leans on the
 * figure above and reads as prose where the card wants a fact.
 */
function closing(
  equity: number,
  outright: number,
  shareValue: number,
  propertyValue: number,
  isShared: boolean,
  share: number
): string {
  if (equity < 0) {
    return isShared
      ? `Your ${formatShare(share)}% share is worth ${formatPenceShort(shareValue)}. The mortgage covers all of it and more.`
      : `The home is worth ${formatPenceShort(shareValue)}. The mortgage covers all of it and more.`
  }
  const ofShare = pct(outright / shareValue)
  if (!isShared) return `You currently own ${ofShare} of the home outright.`
  return `You currently own ${ofShare} of your share outright, and ${pct(outright / propertyValue)} of the home.`
}

/** 0.0816 → "8.2%" */
function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`
}
