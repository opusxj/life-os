import { ReceiptText } from "lucide-react"

import {
  DataChip,
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
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type {
  TransactionOptions,
  TransactionRow,
} from "@/lib/apex/transactions/queries"
import { cn } from "@/lib/utils"
import { AddTransactionDialog } from "./transaction-dialog"
import { TransactionTableRow } from "./transaction-row"

/**
 * The page's headline answer, rendered beneath the title: what came in, what
 * went out, and where that leaves you. Income and expense sums only —
 * transfers and adjustments count in neither.
 */
export function TransactionTotals({ rows }: { rows: TransactionRow[] }) {
  const incomeTotal = sumByKind(rows, "income")
  const expenseTotal = sumByKind(rows, "expense")
  const net = incomeTotal - expenseTotal

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 tabular-nums">
      <span className="text-muted-foreground">
        In{" "}
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          {`+${formatPenceShort(incomeTotal)}`}
        </span>
      </span>
      <span className="text-muted-foreground">
        Out{" "}
        <span className="font-medium text-foreground">
          {`−${formatPenceShort(expenseTotal)}`}
        </span>
      </span>
      <span
        className={cn(
          "font-medium",
          net < 0
            ? "text-destructive"
            : "text-emerald-600 dark:text-emerald-400"
        )}
      >
        {`Net ${net < 0 ? "−" : "+"}${formatPenceShort(Math.abs(net))}`}
      </span>
    </div>
  )
}

/** The ledger: one card, table edge to edge, only the rows scrolling. */
export function TransactionsCard({
  spaceId,
  options,
  rows,
  filtered,
}: {
  spaceId: string
  options: TransactionOptions
  rows: TransactionRow[]
  /** Whether any non-default filter is active (changes the empty-state copy) */
  filtered: boolean
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
                : "Log the first one — it takes ten seconds."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AddTransactionDialog spaceId={spaceId} options={options} />
          </EmptyContent>
        </Empty>
      </TableCard>
    )
  }

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
              <TableHead
                className={cn(TABLE_PINNED_HEAD, "hidden sm:table-cell")}
              >
                Date
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
      </TableScroll>
    </TableCard>
  )
}

/** Pinned to the bottom of the scroll region: exact pence, always in view. */
function TotalsFooter({ rows }: { rows: TransactionRow[] }) {
  const incomeTotal = sumByKind(rows, "income")
  const expenseTotal = sumByKind(rows, "expense")
  const transferCount = rows.filter((row) => row.kind === "transfer").length

  return (
    <TableFooter className="border-t-0 bg-transparent font-normal">
      <TableRow className="hover:bg-transparent">
        <TableCell
          colSpan={3}
          className={cn(TABLE_FOOT, "py-2 pl-3 whitespace-nowrap")}
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            {`${rows.length} ${rows.length === 1 ? "transaction" : "transactions"}`}
            {transferCount > 0 && (
              <DataChip color="#0ea5e9">
                {`${transferCount} ${transferCount === 1 ? "transfer" : "transfers"}`}
              </DataChip>
            )}
          </span>
        </TableCell>
        <TableCell
          className={cn(
            TABLE_FOOT,
            "py-2 pr-2 text-right whitespace-nowrap tabular-nums"
          )}
        >
          <span className="inline-flex items-baseline gap-3">
            <span className="text-emerald-600 dark:text-emerald-400">
              {`+${formatPence(incomeTotal)}`}
            </span>
            <span>{`−${formatPence(expenseTotal)}`}</span>
          </span>
        </TableCell>
        <TableCell className={cn(TABLE_FOOT, "w-10")} />
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
