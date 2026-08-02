import { Coins } from "lucide-react"

import { ApexStatCard, ApexStatValue } from "@/components/apex/stat-card"
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
    <ApexStatCard label="Monthly cost" icon={Coins}>
      <ApexStatValue>{formatPenceShort(total)}</ApexStatValue>
      {parts.length > 1 && (
        <>
          <Separator className="my-2" />
          <div className="space-y-1">
            {parts.map((part) => (
              <div
                key={part.label}
                className="flex items-center justify-between text-[13px] text-muted-foreground"
              >
                <span>{part.label}</span>
                <span className="tabular-nums">{formatPence(part.amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </ApexStatCard>
  )
}
