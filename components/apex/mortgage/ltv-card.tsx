import { Percent } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatTag,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  const nextBand = underwater
    ? null
    : nextBandDown(status.balanceToday, lending.value)

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

      {/* The 0 to 100 band track: a cut at each pricing threshold and a
          notch where this loan sits. Position on a scale, not progress, so
          it stays a custom strip rather than SegmentMeter. The whole strip
          answers on hover, because cuts and notches are exactly the mystery
          pixels the design skill bans. */}
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              role="img"
              aria-label={`Your loan sits at ${ltvPct.toFixed(1)}% of the value it is priced against. The cuts mark lender pricing bands.`}
              className="relative mt-3 h-3.5 w-full cursor-help rounded-full bg-indigo-500/15 dark:bg-indigo-500/20"
            />
          }
        >
          {PRICING_BANDS.map((band) => (
            <div
              key={band}
              className="absolute inset-y-0 w-px bg-card"
              style={{ left: `${band}%` }}
            />
          ))}
          <div
            className="absolute -inset-y-0.5 w-1 -translate-x-1/2 rounded-full bg-indigo-500 dark:bg-indigo-400"
            style={{ left: `${markerPct}%` }}
          />
        </TooltipTrigger>
        <TooltipContent>
          {`Notch: your ${ltvPct.toFixed(1)}%. Cuts: pricing bands.`}
        </TooltipContent>
      </Tooltip>

      {nextBand ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <ApexStatTag tint="property">
            {`${formatPenceShort(nextBand.distance)} to the ${nextBand.band}% band`}
          </ApexStatTag>
          <span className="text-[12px] text-muted-foreground">
            Pricing improves at each band.
          </span>
        </div>
      ) : (
        <ApexStatHint
          className={cn("mt-3", underwater && "font-medium text-destructive")}
        >
          {underwater
            ? edgeVerdict(status.balanceToday, lending)
            : "You are in the lowest pricing band lenders offer."}
        </ApexStatHint>
      )}
    </ApexStatCard>
  )
}

/** Names the base so the figure can't be misread as whole-property LTV. */
function baseDescription(lending: LendingBase): string {
  return lending.shared
    ? `Against your ${formatShare(lending.share)}% share, worth ${formatPenceShort(lending.value)}`
    : `Against your ${formatPenceShort(lending.value)} property value`
}

/**
 * The nearest band below the current position, worked in pence so the
 * distance shown is exactly the balance movement that reaches it. Null at or
 * below the lowest band.
 */
function nextBandDown(
  balance: number,
  base: number
): { band: number; distance: number } | null {
  for (let index = PRICING_BANDS.length - 1; index >= 0; index -= 1) {
    const band = PRICING_BANDS[index]
    const bandBalance = Math.round((base * band) / 100)
    if (balance > bandBalance) {
      return { band, distance: balance - bandBalance }
    }
  }
  return null
}

function edgeVerdict(balance: number, lending: LendingBase): string {
  const excess = formatPenceShort(balance - lending.value)
  return lending.shared
    ? `The loan is ${excess} larger than your share's value.`
    : `The loan is ${excess} larger than your property value.`
}
