import { ReceiptText } from "lucide-react"

import { TableCard, TableScroll } from "@/components/apex/table-shell"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  formatWeekdayDate,
  formatWeekdayFullDate,
  parseDay,
} from "@/lib/apex/dates"
import { formatPenceShort } from "@/lib/apex/money"
import type {
  TransactionOptions,
  TransactionRow,
  TransactionTotals as Totals,
} from "@/lib/apex/transactions/queries"
import { cn } from "@/lib/utils"
import { AddTransactionDialog } from "./transaction-dialog"
import { TransactionLine } from "./transaction-row"

/**
 * The ledger reads as days, not as one wall of rows. Each day opens on a
 * ruled line — the date sitting on a hairline that runs across to the day's
 * own in-minus-out — and its transactions hang beneath as open rows. No
 * column labels and no row borders: the ruled lines are the structure
 * (ratified from the 2026-08-10 mockup round, variation 8 with row C).
 */
type DayGroup = {
  date: string
  rows: TransactionRow[]
  /** Pence; income minus expense across the day's rows */
  net: number
  /** Whether any row is income or expense — a transfers-only day has no net */
  hasFlow: boolean
}

function groupByDay(rows: TransactionRow[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const row of rows) {
    let group = groups[groups.length - 1]
    if (!group || group.date !== row.occurredOn) {
      group = { date: row.occurredOn, rows: [], net: 0, hasFlow: false }
      groups.push(group)
    }
    group.rows.push(row)
    if (row.kind === "income") {
      group.net += row.amount
      group.hasFlow = true
    } else if (row.kind === "expense") {
      group.net -= row.amount
      group.hasFlow = true
    }
  }
  return groups
}

/** The ledger: one card, ruled day sections, only the rows scrolling. */
export function TransactionsCard({
  spaceId,
  options,
  rows,
  totals,
  filtered,
  today,
}: {
  spaceId: string
  options: TransactionOptions
  /** One page — `totals.rowCount` is how many actually match */
  rows: TransactionRow[]
  totals: Totals
  /** Whether any non-default filter is active (changes the empty-state copy) */
  filtered: boolean
  /** yyyy-mm-dd resolved server-side, for the day rules */
  today: string
}) {
  if (rows.length === 0) {
    return (
      <TableCard className="min-h-0 flex-1">
        <Empty className="m-auto">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptText />
            </EmptyMedia>
            <EmptyTitle>No transactions</EmptyTitle>
            <EmptyDescription>
              {filtered
                ? "Nothing matches these filters."
                : "Log the first one. It takes ten seconds."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AddTransactionDialog spaceId={spaceId} options={options} />
          </EmptyContent>
        </Empty>
      </TableCard>
    )
  }

  const truncated = rows.length < totals.rowCount
  // A day cut in half at the page boundary would show a partial sum with no
  // signal, so a truncated page keeps its rules to the dates alone.
  const showDayNets = !truncated

  return (
    <TableCard className="min-h-0 flex-1">
      <TableScroll className="px-3 pt-1 pb-2">
        {groupByDay(rows).map((group, index) => (
          <DaySection
            key={group.date}
            group={group}
            today={today}
            showNet={showDayNets}
            first={index === 0}
            spaceId={spaceId}
            options={options}
          />
        ))}
        {truncated && (
          <p className="sticky bottom-0 -mx-3 -mb-2 border-t bg-card px-5 py-2 text-[13px] text-muted-foreground">
            {`Showing ${rows.length} of ${totals.rowCount} transactions. Narrow the filters to see the rest.`}
          </p>
        )}
      </TableScroll>
    </TableCard>
  )
}

function DaySection({
  group,
  today,
  showNet,
  first,
  spaceId,
  options,
}: {
  group: DayGroup
  today: string
  showNet: boolean
  first: boolean
  spaceId: string
  options: TransactionOptions
}) {
  return (
    <div className={cn(!first && "mt-2.5")}>
      <div className="flex items-center gap-2.5 px-2 pt-2.5 pb-1.5">
        <span className="shrink-0 text-[12px] font-medium text-muted-foreground">
          {dayLabel(group.date, today)}
        </span>
        <span aria-hidden className="flex-1 border-t" />
        {showNet && group.hasFlow && group.net !== 0 && (
          <span
            className={cn(
              "shrink-0 text-[12px] tabular-nums",
              group.net > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            )}
          >
            {group.net > 0
              ? `+${formatPenceShort(group.net)}`
              : `−${formatPenceShort(-group.net)}`}
          </span>
        )}
      </div>
      {group.rows.map((row) => (
        <TransactionLine
          key={row.id}
          spaceId={spaceId}
          options={options}
          transaction={row}
        />
      ))}
    </div>
  )
}

/**
 * Today and yesterday read as themselves before the calendar date; other
 * years spell the year, where a bare "Friday 12th December" would read as
 * upcoming.
 */
function dayLabel(date: string, today: string): string {
  if (date === today) return `Today, ${formatWeekdayDate(date)}`
  if (date === dayBefore(today)) return `Yesterday, ${formatWeekdayDate(date)}`
  return date.slice(0, 4) === today.slice(0, 4)
    ? formatWeekdayDate(date)
    : formatWeekdayFullDate(date)
}

/** "2026-08-10" → "2026-08-09", from local parts like every other key. */
function dayBefore(key: string): string {
  const date = parseDay(key)
  date.setDate(date.getDate() - 1)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
