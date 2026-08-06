import { Coins } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatFigure,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { Separator } from "@/components/ui/separator"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"

/** What does this cost every month, all in? */
export function MonthlyCostCard({ mortgage }: { mortgage: Mortgage }) {
  const parts: { label: string; amount: number }[] = [
    { label: "Mortgage payment", amount: mortgage.monthlyPayment },
  ]
  if (mortgage.rentMonthly !== null) {
    parts.push({ label: "Rent", amount: mortgage.rentMonthly })
  }
  for (const extra of mortgage.extras) {
    parts.push({ label: extra.label, amount: extra.monthly })
  }
  const total = parts.reduce((sum, part) => sum + part.amount, 0)

  return (
    <ApexStatCard
      label="Monthly cost"
      description="Every monthly cost you recorded"
      icon={Coins}
      iconClassName={ANCHOR_TINTS.bill}
    >
      <ApexStatValue>
        <ApexStatFigure>{formatPenceShort(total)}</ApexStatFigure>
      </ApexStatValue>
      {parts.length > 1 && (
        <>
          <Separator className="my-2.5" />
          <div className="space-y-1.5">
            {parts.map((part, index) => (
              <div
                key={`${index}-${part.label}`}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="truncate text-[13px] text-muted-foreground">
                  {part.label}
                </span>
                <span className="shrink-0 text-[13px] font-medium tabular-nums">
                  {formatPence(part.amount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </ApexStatCard>
  )
}
