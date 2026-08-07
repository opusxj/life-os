import { Sprout } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { SegmentMeter } from "@/components/apex/meter"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { lendingBase, type MortgageStatus } from "@/lib/apex/mortgage/status"

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

  // Widths are proportions of the FULL property value. Debt is clamped to
  // the share's value so negative equity never paints over the landlord's
  // slice. Every region answers "what is that?" on hover.
  //
  // The colours carry the ownership line rather than three arbitrary greys:
  // the emerald family is the half you own, solid where it is yours outright
  // and faded where the mortgage still has a claim on it, and the landlord's
  // half sits outside that family entirely. So the 50/50 split of a
  // shared-ownership home is legible before a word of it is read.
  const segments = [
    {
      pct: (Math.max(0, equity) / propertyValue) * 100,
      className: "bg-emerald-500",
      tip: `${formatPenceShort(Math.max(0, equity))} yours outright`,
    },
    {
      pct: (Math.min(balance, shareValue) / propertyValue) * 100,
      className: "bg-emerald-500/30 dark:bg-emerald-500/40",
      tip: `${formatPenceShort(Math.min(balance, shareValue))} mortgaged`,
    },
    {
      pct: isShared ? 100 - share : 0,
      className: "bg-muted-foreground/20",
      tip: `Landlord's ${formatShare(100 - share)}%, worth ${formatPenceShort(propertyValue - shareValue)}`,
    },
  ]

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

      {/* One property, up to three claims on it */}
      <SegmentMeter
        className="mt-3"
        label={`Of the ${formatPenceShort(propertyValue)} home: ${formatPenceShort(Math.max(0, equity))} equity, ${formatPenceShort(Math.min(balance, shareValue))} mortgaged${isShared ? `, ${formatShare(100 - share)}% held by your landlord` : ""}.`}
        segments={segments}
      />

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
    </ApexStatCard>
  )
}
