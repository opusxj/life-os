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
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type {
  TransactionFilters,
  TransactionOptions,
  TransactionRow,
} from "@/lib/apex/transactions/queries"
import { cn } from "@/lib/utils"
import { AddTransactionDrawer } from "./transaction-drawer"
import { TransactionFilterBar } from "./transaction-filters"
import { TransactionTableRow } from "./transaction-row"

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
        >
          {rows.length > 0 && <HeaderTotals rows={rows} />}
        </TransactionFilterBar>
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
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="px-4">Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Card</TableHead>
          <TableHead className="px-4 text-right">Amount</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TransactionTableRow
            key={row.id}
            spaceId={spaceId}
            options={options}
            transaction={row}
          />
        ))}
      </TableBody>
      <TotalsFooter rows={rows} />
    </Table>
  )
}

/**
 * The filter row's live answer: In / Out / Net for the visible rows (house
 * short format — the exact-pence versions live in the footer). Income and
 * expense sums only; transfers and adjustments count in neither.
 */
function HeaderTotals({ rows }: { rows: TransactionRow[] }) {
  const incomeTotal = sumByKind(rows, "income")
  const expenseTotal = sumByKind(rows, "expense")
  const net = incomeTotal - expenseTotal

  return (
    <div className="ml-auto flex items-center gap-3 text-[13px] whitespace-nowrap tabular-nums">
      <span className="text-emerald-600 dark:text-emerald-400">
        {`In +${formatPenceShort(incomeTotal)}`}
      </span>
      <span>{`Out −${formatPenceShort(expenseTotal)}`}</span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 font-medium",
          net < 0
            ? "bg-destructive/10 text-destructive dark:bg-destructive/15"
            : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
        )}
      >
        {`Net ${net < 0 ? "−" : "+"}${formatPenceShort(Math.abs(net))}`}
      </span>
    </div>
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
      <TableRow className="hover:bg-transparent">
        <TableCell
          colSpan={5}
          className="px-4 font-normal whitespace-nowrap text-muted-foreground"
        >
          {parts.join(" · ")}
        </TableCell>
        <TableCell className="px-4 text-right whitespace-nowrap tabular-nums">
          <span className="inline-flex items-baseline gap-3">
            <span className="text-emerald-600 dark:text-emerald-400">
              {`In +${formatPence(incomeTotal)}`}
            </span>
            <span>{`Out −${formatPence(expenseTotal)}`}</span>
          </span>
        </TableCell>
        <TableCell className="w-10" />
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
