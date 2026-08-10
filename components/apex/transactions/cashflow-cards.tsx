import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { DataProgress } from "@/components/apex/progress"
import {
  ApexStatCard,
  ApexStatFigure,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { formatPence } from "@/lib/apex/money"
import type { TransactionTotals } from "@/lib/apex/transactions/queries"
import { cn } from "@/lib/utils"

/**
 * The page's headline answer as three cards: what came in, what went out, and
 * where that leaves you. Figures are the database aggregate over the whole
 * filtered set, so they stay true when the table below shows one page of it.
 * The in/out bars share one scale (the larger of the two), so the gap between
 * them is a length rather than a subtraction the reader performs.
 */
export function CashflowCards({
  totals,
  monthName,
  currentMonth,
}: {
  totals: TransactionTotals
  /** Bare spelled month ("August"); null when the view is all time */
  monthName: string | null
  /** Whether the window is the month in progress ("so far" is only true there) */
  currentMonth: boolean
}) {
  const net = totals.income - totals.expense
  const scale = Math.max(totals.income, totals.expense)

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <ApexStatCard
        label="Money in"
        description={monthName ? `Landed in ${monthName}` : "Landed over all time"}
        icon={ArrowDownLeft}
        iconClassName={ANCHOR_TINTS.balance}
      >
        <ApexStatValue className="text-emerald-600 dark:text-emerald-400">
          <ApexStatFigure negative>{`+${formatPence(totals.income)}`}</ApexStatFigure>
        </ApexStatValue>
        <div className="mt-auto pt-4">
          <DataProgress
            value={scale > 0 ? (totals.income / scale) * 100 : 0}
            color="#10b981"
            aria-label="Money in, on the same scale as money out"
          />
        </div>
      </ApexStatCard>

      <ApexStatCard
        label="Money out"
        description={monthName ? `Spent in ${monthName}` : "Spent over all time"}
        icon={ArrowUpRight}
        iconClassName={ANCHOR_TINTS.bill}
      >
        <ApexStatValue>
          <ApexStatFigure>{`−${formatPence(totals.expense)}`}</ApexStatFigure>
        </ApexStatValue>
        <div className="mt-auto pt-4">
          <DataProgress
            value={scale > 0 ? (totals.expense / scale) * 100 : 0}
            color="#f59e0b"
            aria-label="Money out, on the same scale as money in"
          />
        </div>
      </ApexStatCard>

      <ApexStatCard
        label="Left over"
        description={
          monthName ? `In minus out for ${monthName}` : "In minus out over all time"
        }
        icon={Wallet}
        iconClassName={ANCHOR_TINTS.primary}
      >
        <ApexStatValue
          className={cn(
            net > 0 && "text-emerald-600 dark:text-emerald-400",
            net < 0 && "text-destructive"
          )}
        >
          <ApexStatFigure negative={net !== 0}>
            {net === 0
              ? formatPence(0)
              : `${net < 0 ? "−" : "+"}${formatPence(Math.abs(net))}`}
          </ApexStatFigure>
        </ApexStatValue>
        {net < 0 && (
          <ApexStatHint>
            {currentMonth ? "More out than in so far" : "More out than in"}
          </ApexStatHint>
        )}
      </ApexStatCard>
    </div>
  )
}
