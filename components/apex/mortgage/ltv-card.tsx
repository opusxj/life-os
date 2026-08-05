import { Percent } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import {
  lendingBase,
  type LendingBase,
  type MortgageStatus,
} from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatShare } from "./format"

/**
 * The LTV thresholds UK lenders reprice at, best to worst. Below 60 there is
 * nothing left to improve into.
 */
const PRICING_BANDS = [60, 75, 80, 85, 90, 95]

/**
 * What price band does the loan put me in, and how far is the next one?
 *
 * Share-aware: lenders price a shared-ownership remortgage against the share,
 * not the whole property, so a 50% share makes £142,350 on £310,000 a 91.8%
 * loan and not the comfortable-looking 45.9% the full value would suggest.
 * The description always names the base so the figure cannot be misread.
 */
export function LtvCard({
  mortgage,
  status,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  className?: string
}) {
  const lending = lendingBase(mortgage)

  if (lending === null) {
    return (
      <ApexStatCard
        label="Pricing band"
        description="No property value recorded"
        icon={Percent}
        iconClassName={ANCHOR_TINTS.property}
        className={className}
      >
        <ApexStatValue className="text-muted-foreground">—</ApexStatValue>
        <ApexStatHint className="mt-1.5">
          Edit the mortgage to add one and see your loan to value and pricing
          band.
        </ApexStatHint>
      </ApexStatCard>
    )
  }

  const ltvPct = (status.balanceToday / lending.value) * 100
  const markerPct = Math.min(100, Math.max(0, ltvPct))
  const underwater = status.balanceToday > lending.value

  return (
    <ApexStatCard
      label="Pricing band"
      description={baseDescription(lending)}
      icon={Percent}
      iconClassName={ANCHOR_TINTS.property}
      className={className}
    >
      <ApexStatValue>
        {`${ltvPct.toFixed(1)}%`} <ApexStatUnit>loan to value</ApexStatUnit>
      </ApexStatValue>

      {/* The 0 to 100 band track: a hairline cut at each pricing threshold and
          a notch where this loan sits. It shows position, not progress, so it
          stays a custom strip rather than ui/Progress. */}
      <div
        aria-hidden
        className="relative mt-2.5 h-1.5 w-full rounded-full bg-muted"
      >
        {PRICING_BANDS.map((band) => (
          <div
            key={band}
            className="absolute inset-y-0 w-px bg-background"
            style={{ left: `${band}%` }}
          />
        ))}
        <div
          className="absolute -inset-y-0.5 w-0.5 -translate-x-1/2 rounded-full bg-indigo-500 dark:bg-indigo-400"
          style={{ left: `${markerPct}%` }}
        />
      </div>

      <ApexStatHint
        className={cn("mt-2", underwater && "font-medium text-destructive")}
      >
        {verdict(status.balanceToday, lending.value, lending.shared)}
      </ApexStatHint>
    </ApexStatCard>
  )
}

/** Names the base so the figure can't be misread as whole-property LTV. */
function baseDescription(lending: LendingBase): string {
  return lending.shared
    ? `Against your ${formatShare(lending.share)}% share, worth ${formatPenceShort(lending.value)}`
    : `Against your ${formatPenceShort(lending.value)} property value`
}

function verdict(balance: number, base: number, shared: boolean): string {
  if (balance > base) {
    const excess = formatPenceShort(balance - base)
    return shared
      ? `The loan is ${excess} larger than your share's value.`
      : `The loan is ${excess} larger than your property value.`
  }

  // The nearest band below the current position, worked in pence so the
  // distance shown is exactly the balance movement that reaches it.
  for (let index = PRICING_BANDS.length - 1; index >= 0; index -= 1) {
    const band = PRICING_BANDS[index]
    const bandBalance = Math.round((base * band) / 100)
    if (balance > bandBalance) {
      return `${formatPenceShort(balance - bandBalance)} of balance away from the ${band}% band. Pricing improves at each band.`
    }
  }

  return "You are in the lowest pricing band lenders offer."
}
