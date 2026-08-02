import { ReceiptText } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { formatPence } from "@/lib/apex/money"
import type {
  TransactionFilters,
  TransactionOptions,
  TransactionRow,
} from "@/lib/apex/transactions/queries"
import { cn } from "@/lib/utils"
import { AddTransactionDrawer } from "./transaction-drawer"
import { TransactionFilterBar } from "./transaction-filters"
import { TransactionRowActions } from "./transaction-row-actions"

/** The page's one composed surface: filter toolbar in the header, ledger below. */
export function TransactionsCard({
  spaceId,
  options,
  filters,
  defaultMonth,
  rows,
  filtered,
}: {
  spaceId: string
  options: TransactionOptions
  filters: TransactionFilters
  defaultMonth: string
  rows: TransactionRow[]
  /** Whether any non-default filter is active (changes the empty-state copy) */
  filtered: boolean
}) {
  return (
    <Card size="sm" className={cn("gap-0", rows.length > 0 && "pb-0")}>
      <CardHeader className="border-b">
        <TransactionFilterBar
          options={options}
          filters={filters}
          defaultMonth={defaultMonth}
        />
      </CardHeader>
      <CardContent className="px-0">
        {rows.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText />
              </EmptyMedia>
              <EmptyTitle>No transactions</EmptyTitle>
              <EmptyDescription>
                {filtered
                  ? "Nothing matches these filters."
                  : "Log the first one — it takes ten seconds."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <AddTransactionDrawer spaceId={spaceId} options={options} />
            </EmptyContent>
          </Empty>
        ) : (
          <TransactionsTable spaceId={spaceId} options={options} rows={rows} />
        )}
      </CardContent>
    </Card>
  )
}

function TransactionsTable({
  spaceId,
  options,
  rows,
}: {
  spaceId: string
  options: TransactionOptions
  rows: TransactionRow[]
}) {
  return (
    <Table className="text-[13px]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="h-8 px-3 text-[11px] font-medium text-muted-foreground">
            Date
          </TableHead>
          <TableHead className="h-8 px-2 text-[11px] font-medium text-muted-foreground">
            Description
          </TableHead>
          <TableHead className="h-8 px-2 text-[11px] font-medium text-muted-foreground">
            Category
          </TableHead>
          <TableHead className="h-8 px-2 text-[11px] font-medium text-muted-foreground">
            Account
          </TableHead>
          <TableHead className="h-8 px-2 text-[11px] font-medium text-muted-foreground">
            Card
          </TableHead>
          <TableHead className="h-8 px-3 text-right text-[11px] font-medium text-muted-foreground">
            Amount
          </TableHead>
          <TableHead className="h-8 w-10 px-2" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="group/row h-8">
            <TableCell className="w-20 px-3 py-0 whitespace-nowrap text-muted-foreground">
              {formatDay(row.occurredOn)}
            </TableCell>
            <TableCell className="w-full max-w-0 truncate px-2 py-0">
              {row.description}
            </TableCell>
            <TableCell className="px-2 py-0 whitespace-nowrap">
              <CategoryCell row={row} />
            </TableCell>
            <TableCell className="px-2 py-0 whitespace-nowrap text-muted-foreground">
              {row.accountName}
            </TableCell>
            <TableCell
              className="px-2 py-0 whitespace-nowrap text-muted-foreground"
              title={row.cardName ?? undefined}
            >
              {row.cardLast4 ? `·${row.cardLast4}` : null}
            </TableCell>
            <TableCell
              className={cn(
                "px-3 py-0 text-right font-medium whitespace-nowrap tabular-nums",
                amountClass(row.kind)
              )}
            >
              {amountText(row)}
            </TableCell>
            <TableCell className="w-10 px-2 py-0 text-right">
              <TransactionRowActions
                spaceId={spaceId}
                options={options}
                transaction={row}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TotalsFooter rows={rows} />
    </Table>
  )
}

/**
 * In/Out totals for the visible rows: income vs expense sums only —
 * transfers count in neither (labelled by count), adjustments excluded.
 */
function TotalsFooter({ rows }: { rows: TransactionRow[] }) {
  const incomeTotal = sumByKind(rows, "income")
  const expenseTotal = sumByKind(rows, "expense")
  const transferCount = rows.filter((row) => row.kind === "transfer").length

  const parts = [
    `${rows.length} ${rows.length === 1 ? "transaction" : "transactions"}`,
  ]
  if (transferCount > 0) {
    parts.push(
      `${transferCount} ${transferCount === 1 ? "transfer" : "transfers"}`
    )
  }

  return (
    <TableFooter>
      <TableRow className="h-8 hover:bg-transparent">
        <TableCell
          colSpan={5}
          className="px-3 py-0 font-normal whitespace-nowrap text-muted-foreground"
        >
          {parts.join(" · ")}
        </TableCell>
        <TableCell className="px-3 py-0 text-right whitespace-nowrap tabular-nums">
          <span className="inline-flex items-baseline gap-3">
            <span className="text-emerald-600 dark:text-emerald-400">
              {`In +${formatPence(incomeTotal)}`}
            </span>
            <span>{`Out −${formatPence(expenseTotal)}`}</span>
          </span>
        </TableCell>
        <TableCell className="w-10 px-2 py-0" />
      </TableRow>
    </TableFooter>
  )
}

function sumByKind(rows: TransactionRow[], kind: TransactionRow["kind"]) {
  return rows.reduce(
    (total, row) => (row.kind === kind ? total + row.amount : total),
    0
  )
}

function CategoryCell({ row }: { row: TransactionRow }) {
  if (row.kind === "transfer") {
    return (
      <span className="text-muted-foreground">{`→ ${row.transferAccountName ?? "another account"}`}</span>
    )
  }
  if (row.kind === "adjustment") {
    return <span className="text-muted-foreground italic">sync</span>
  }
  if (!row.categoryName) return null
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: row.categoryColor ?? undefined }}
      />
      {row.categoryName}
    </span>
  )
}

function amountClass(kind: TransactionRow["kind"]): string {
  switch (kind) {
    case "income":
      return "text-emerald-600 dark:text-emerald-400"
    case "transfer":
      return "text-muted-foreground"
    case "adjustment":
      return "font-normal text-muted-foreground italic"
    default:
      return ""
  }
}

function amountText(row: TransactionRow): string {
  return row.kind === "income"
    ? `+${formatPence(row.amount)}`
    : formatPence(row.amount)
}

const DAY_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
})
const DAY_YEAR_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

function formatDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.getFullYear() === new Date().getFullYear()
    ? DAY_FORMAT.format(date)
    : DAY_YEAR_FORMAT.format(date)
}
