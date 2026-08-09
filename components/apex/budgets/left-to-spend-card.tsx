import { Wallet } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { MeterHead } from "@/components/apex/meter"
import { DataProgress } from "@/components/apex/progress"
import {
  ApexStatCard,
  ApexStatFigure,
  ApexStatHint,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { formatPenceShort } from "@/lib/apex/money"
import { cn } from "@/lib/utils"

/**
 * The page's headline answer, in a term that teaches: "Headroom" was jargon
 * for an audience that has never run an envelope, "left to spend" is the
 * question they actually arrive with. The provenance line does the trust
 * work the old card skipped — these figures come from logged spending, not
 * from anywhere clever. Over state leads with the consequence and skips the
 * day-rate hint; the rows below locate the damage.
 */
export function LeftToSpendCard({
  spent,
  budgeted,
  monthName,
  monthTick,
  daysLeft,
  className,
}: {
  /** pence, live expense transactions in budgeted categories this month */
  spent: number
  budgeted: number
  /** Bare spelled month ("August") */
  monthName: string
  /** 0-100: how far through the month the server clock sits */
  monthTick: number
  /** Whole days of the month after today */
  daysLeft: number
  className?: string
}) {
  const left = budgeted - spent
  const over = left < 0
  const perDayPounds = daysLeft > 0 ? Math.round(left / daysLeft / 100) : 0

  return (
    <ApexStatCard
      label="Left to spend"
      description={`After the spending you've logged this ${monthName}`}
      icon={Wallet}
      iconClassName={ANCHOR_TINTS.primary}
      className={className}
    >
      <ApexStatValue className={cn(over && "text-destructive")}>
        {over ? (
          <>
            <ApexStatUnit>Over by</ApexStatUnit>{" "}
            <ApexStatFigure negative>{formatPenceShort(-left)}</ApexStatFigure>
          </>
        ) : (
          <>
            <ApexStatFigure>{formatPenceShort(left)}</ApexStatFigure>{" "}
            <ApexStatUnit>left to spend</ApexStatUnit>
          </>
        )}
      </ApexStatValue>

      <div className="mt-3.5">
        <MeterHead
          name="Spent"
          amount={
            <>
              <span className="font-medium">{formatPenceShort(spent)}</span>
              <span className="text-muted-foreground">
                {` of ${formatPenceShort(budgeted)}`}
              </span>
            </>
          }
          amountClassName="font-normal"
        />
        <DataProgress
          value={budgeted > 0 ? Math.min(100, (spent / budgeted) * 100) : 0}
          color={over ? "var(--destructive)" : "var(--primary)"}
          dim={over}
          tick={monthTick}
          tickLabel={`${monthTick}% through ${monthName}`}
          aria-label="Spent of budgeted this month"
        />
      </div>

      {left > 0 && daysLeft > 0 && (
        <ApexStatHint className="mt-2.5">
          {perDayPounds >= 1
            ? `About £${perDayPounds} a day for the rest of ${monthName}.`
            : `Under £1 a day for the rest of ${monthName}.`}
        </ApexStatHint>
      )}
    </ApexStatCard>
  )
}
