import { CalendarRange } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { MeterSwatch } from "@/components/apex/meter"
import { ApexCardFootnote, ApexStatCard } from "@/components/apex/stat-card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatMonth, formatMonthShort } from "@/lib/apex/dates"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type { RecurringPayment } from "@/lib/apex/subscriptions/queries"
import { monthTotals } from "@/lib/apex/subscriptions/schedule"
import { cn } from "@/lib/utils"

/** A month this far above the median is worth naming; below it, the calmer
 *  fact is that no month is. */
const HEAVY_RATIO = 1.25

/**
 * Which month is going to ambush you? The table answers "what's next" and the
 * Outgoings card answers "how much a month", but neither can say that next
 * January costs £500 more than next February — the yearly premium, the
 * quarterly water bill, the month three things land together. Each column is
 * a real month's real occurrences (schedule.ts), so a yearly item is one tall
 * column, not a twelfth smeared everywhere. Starts next month: the current
 * month is part-spent and a partial column would mislead.
 */
export function MonthsAheadCard({
  payments,
  today,
  className,
}: {
  payments: RecurringPayment[]
  /** yyyy-mm-dd resolved server-side so SSR and hydration agree */
  today: string
  className?: string
}) {
  const months = monthTotals(payments, today)
  const totals = months.map((month) => month.bills + month.subscriptions)
  const max = Math.max(...totals)
  if (max <= 0) return null

  const hasBills = months.some((month) => month.bills > 0)
  const hasSubscriptions = months.some((month) => month.subscriptions > 0)

  const heaviest = months[totals.indexOf(max)]
  const median = [...totals].sort((a, b) => a - b)[Math.floor(totals.length / 2)]
  const heavy = median > 0 && max >= median * HEAVY_RATIO && heaviest.biggest

  // Projections round to the pound: pence here would be false precision on
  // a "what lands when" sketch (the table holds the exact figures).
  const verdict = heavy
    ? `${formatMonth(`${heaviest.month}-01`)} is the heaviest month at ${aboutPounds(max)}, when ${heaviest.biggest!.name} lands.`
    : `No heavy months ahead; every month is close to ${aboutPounds(median)}.`

  return (
    <ApexStatCard
      label="The months ahead"
      description="The next twelve months, if everything keeps renewing"
      icon={CalendarRange}
      iconClassName={ANCHOR_TINTS.bill}
      className={className}
    >
      <div
        role="img"
        aria-label={`The next twelve months of recurring payments. ${verdict}`}
        className="mt-3 flex h-24 items-end gap-1.5"
      >
        {months.map((month, index) => (
          <div
            key={month.month}
            className="flex h-full flex-1 flex-col justify-end"
          >
            <div
              className="flex w-full flex-col gap-px"
              style={{ height: `${(totals[index] / max) * 100}%` }}
            >
              {month.subscriptions > 0 && (
                <Segment
                  grow={month.subscriptions}
                  tip={`${formatPence(month.subscriptions)} in subscriptions`}
                  className={cn(
                    "bg-violet-500 rounded-t-[4px]",
                    month.bills === 0 && "rounded-b-[4px]"
                  )}
                />
              )}
              {month.bills > 0 && (
                <Segment
                  grow={month.bills}
                  tip={`${formatPence(month.bills)} in bills`}
                  className={cn(
                    "bg-sky-500 rounded-b-[4px]",
                    month.subscriptions === 0 && "rounded-t-[4px]"
                  )}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {months.map((month) => (
          <span
            key={month.month}
            className="flex-1 text-center text-[11px] text-muted-foreground"
          >
            {formatMonthShort(`${month.month}-01`)}
          </span>
        ))}
      </div>

      {/* Identification only, cost-ahead's key idiom; one kind needs none. */}
      {hasBills && hasSubscriptions && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MeterSwatch className="bg-sky-500" />
            bills
          </span>
          <span className="flex items-center gap-1.5">
            <MeterSwatch className="bg-violet-500" />
            subscriptions
          </span>
        </div>
      )}

      <ApexCardFootnote>{verdict}</ApexCardFootnote>
    </ApexStatCard>
  )
}

/** A month's share of one kind: a hoverable region, never a mystery pixel. */
function Segment({
  grow,
  tip,
  className,
}: {
  grow: number
  tip: string
  className: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            aria-hidden
            className={cn("w-full min-h-[3px] basis-0", className)}
            style={{ flexGrow: grow }}
          />
        }
      />
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

/** "£820.97" is a projection wearing a ledger's precision; "£821" is honest. */
function aboutPounds(pence: number): string {
  return formatPenceShort(Math.round(pence / 100) * 100)
}
