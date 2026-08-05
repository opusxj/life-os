import { Sprout } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { lendingBase, type MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatShare } from "./format"

/**
 * How much of this home is actually yours.
 *
 * Equity is measured against the share you own, not the whole property: on a
 * 50% shared-ownership home the mortgage sits inside your half. This card also
 * carries the whole ownership story (it absorbed the Ownership card): one
 * full-property bar showing your stake, the mortgage debt, and the landlord's
 * share, each sized against the full property value.
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
  // No valuation, no stake to size. The LTV card owns the add-value prompt.
  const propertyValue = mortgage.propertyValue
  const lending = lendingBase(mortgage)
  if (propertyValue === null || propertyValue <= 0 || lending === null) {
    return null
  }
  const { value: shareValue, shared: isShared, share } = lending

  const balance = status.balanceToday
  const equity = shareValue - balance

  // Widths are proportions of the FULL property value. Debt is clamped to the
  // share's value so negative equity never paints over the landlord's slice,
  // and the last segment takes the remainder so rounding never leaves a gap.
  const segments = [
    {
      key: "equity",
      className: "bg-emerald-500",
      width: (Math.max(0, equity) / propertyValue) * 100,
    },
    {
      key: "debt",
      className: "bg-foreground/25",
      width: (Math.min(balance, shareValue) / propertyValue) * 100,
    },
    {
      key: "landlord",
      className: "bg-muted",
      width: isShared ? 100 - share : 0,
    },
  ].filter((segment) => segment.width > 0)

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

      {/* One property, up to three claims on it. Parts of one whole, so this
          stays a custom segmented bar rather than ui/Progress, which renders
          exactly one indicator. */}
      <div
        aria-hidden
        className="mt-2.5 flex h-1.5 w-full gap-px overflow-hidden rounded-full"
      >
        {segments.map((segment, index) => (
          <div
            key={segment.key}
            className={cn(
              "h-full",
              index === 0 && "rounded-l-full",
              index === segments.length - 1 && "flex-1 rounded-r-full",
              segment.className
            )}
            style={
              index < segments.length - 1
                ? { width: `${segment.width}%` }
                : undefined
            }
          />
        ))}
      </div>

      {equity < 0 ? (
        <ApexStatHint className="mt-2 font-medium text-destructive">
          {isShared
            ? `Your ${formatShare(share)}% share is worth ${formatPenceShort(shareValue)}. The mortgage covers all of it and more.`
            : `The home is worth ${formatPenceShort(shareValue)}. The mortgage covers all of it and more.`}
        </ApexStatHint>
      ) : (
        <ApexStatHint className="mt-2">
          {isShared
            ? `Your ${formatShare(share)}% share is worth ${formatPenceShort(shareValue)}. The mortgage covers ${formatPenceShort(balance)} of it.`
            : `The mortgage covers ${formatPenceShort(balance)} of it.`}
        </ApexStatHint>
      )}
      {isShared && (
        <ApexStatHint>
          {`Your landlord holds the other ${formatShare(100 - share)}%.`}
        </ApexStatHint>
      )}
    </ApexStatCard>
  )
}
