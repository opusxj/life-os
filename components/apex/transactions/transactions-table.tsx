import { ReceiptText } from "lucide-react"

import {
  TABLE_FOOT,
  TABLE_PINNED_HEAD,
  TableCard,
  TableScroll,
} from "@/components/apex/table-shell"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { TransactionTableRow } from "./transaction-row"

/**
 * The ledger reads as days, not as one wall of rows: each day gets a quiet
 * divider carrying the date (so the rows don't repeat it) and the day's own
 * in-minus-out, transfers and syncs counting in neither.
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

/** The ledger: one card, day-grouped rows, only the rows scrolling. */
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
  /** yyyy-mm-dd resolved server-side, for the day dividers */
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
  // signal, so a truncated page keeps its dividers to the dates alone.
  const showDayNets = !truncated

  return (
    <TableCard className="min-h-0 flex-1">
      <TableScroll>
        <Table>
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(TABLE_PINNED_HEAD, "pl-3")}>
                Transaction
              </TableHead>
              <TableHead
                className={cn(TABLE_PINNED_HEAD, "hidden md:table-cell")}
              >
                Category
              </TableHead>
              <TableHead className={cn(TABLE_PINNED_HEAD, "pr-2 text-right")}>
                Amount
              </TableHead>
              <TableHead className={cn(TABLE_PINNED_HEAD, "w-10")}>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupByDay(rows).map((group) => (
              <DayRows
                key={group.date}
                group={group}
                today={today}
                showNet={showDayNets}
                spaceId={spaceId}
                options={options}
              />
            ))}
          </TableBody>
          {truncated && (
            <TableFooter className="border-t-0 bg-transparent font-normal">
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className={cn(TABLE_FOOT, "py-2 pl-3 text-muted-foreground")}
                >
                  {`Showing ${rows.length} of ${totals.rowCount} transactions. Narrow the filters to see the rest.`}
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableScroll>
    </TableCard>
  )
}

function DayRows({
  group,
  today,
  showNet,
  spaceId,
  options,
}: {
  group: DayGroup
  today: string
  showNet: boolean
  spaceId: string
  options: TransactionOptions
}) {
  return (
    <>
      <TableRow className="border-b-0 hover:bg-transparent">
        <TableCell colSpan={4} className="bg-muted/40 px-3 py-1.5">
          <span className="flex items-baseline justify-between gap-3 text-[12px] font-medium text-muted-foreground">
            {dividerLabel(group.date, today)}
            {showNet && group.hasFlow && group.net !== 0 && (
              <span
                className={cn(
                  "font-normal tabular-nums",
                  group.net > 0 && "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {group.net > 0
                  ? `+${formatPenceShort(group.net)}`
                  : `−${formatPenceShort(-group.net)}`}
              </span>
            )}
          </span>
        </TableCell>
      </TableRow>
      {group.rows.map((row) => (
        <TransactionTableRow
          key={row.id}
          spaceId={spaceId}
          options={options}
          transaction={row}
        />
      ))}
    </>
  )
}

/**
 * Today and yesterday read as themselves before the calendar date; other
 * years spell the year, where a bare "Friday 12th December" would read as
 * upcoming.
 */
function dividerLabel(date: string, today: string): string {
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
