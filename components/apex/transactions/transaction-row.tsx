"use client"

import * as React from "react"

import { TableCell, TableRow } from "@/components/ui/table"
import { formatPence } from "@/lib/apex/money"
import type {
  TransactionOptions,
  TransactionRow as TransactionRowData,
} from "@/lib/apex/transactions/queries"
import { cn } from "@/lib/utils"
import { TransactionDrawer } from "./transaction-drawer"
import { TransactionRowActions } from "./transaction-row-actions"

/**
 * One ledger row. The whole row opens the edit drawer — except adjustment
 * rows, which are Sync-balance audit entries and stay view-only. The kebab
 * cell stops propagation so menu clicks never double-trigger the row; the
 * drawer mounts as a sibling of the row so its (portalled) clicks don't
 * bubble back into the row handler through the React tree.
 */
export function TransactionTableRow({
  spaceId,
  options,
  transaction,
}: {
  spaceId: string
  options: TransactionOptions
  transaction: TransactionRowData
}) {
  const [editOpen, setEditOpen] = React.useState(false)
  const canEdit = transaction.kind !== "adjustment"

  return (
    <>
      <TableRow
        className={cn(canEdit && "cursor-pointer")}
        onClick={canEdit ? () => setEditOpen(true) : undefined}
      >
        <TableCell className="w-24 px-4 whitespace-nowrap text-muted-foreground">
          {formatDay(transaction.occurredOn)}
        </TableCell>
        <TableCell className="w-full max-w-0 truncate font-medium">
          {transaction.description}
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <CategoryCell row={transaction} />
        </TableCell>
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {transaction.accountName}
        </TableCell>
        <TableCell
          className="whitespace-nowrap text-muted-foreground"
          title={transaction.cardName ?? undefined}
        >
          {transaction.cardLast4 ? `·${transaction.cardLast4}` : null}
        </TableCell>
        <TableCell
          className={cn(
            "px-4 text-right font-medium whitespace-nowrap tabular-nums",
            amountClass(transaction.kind)
          )}
        >
          {amountText(transaction)}
        </TableCell>
        <TableCell
          className="w-10 py-0 text-right"
          onClick={(event) => event.stopPropagation()}
        >
          <TransactionRowActions
            transaction={transaction}
            canEdit={canEdit}
            onEdit={() => setEditOpen(true)}
          />
        </TableCell>
      </TableRow>
      {canEdit && (
        <TransactionDrawer
          open={editOpen}
          onOpenChange={setEditOpen}
          spaceId={spaceId}
          options={options}
          transaction={transaction}
        />
      )}
    </>
  )
}

function CategoryCell({ row }: { row: TransactionRowData }) {
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

function amountClass(kind: TransactionRowData["kind"]): string {
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

function amountText(row: TransactionRowData): string {
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
