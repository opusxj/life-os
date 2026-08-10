"use client"

import * as React from "react"
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  RefreshCw,
  type LucideIcon,
} from "lucide-react"

import { AvatarBadge, EntityAvatar } from "@/components/apex/entity-avatar"
import { DataChip } from "@/components/apex/table-shell"
import { MetaDot } from "@/components/shared/meta-dot"
import { TableCell, TableRow } from "@/components/ui/table"
import { formatPence } from "@/lib/apex/money"
import type {
  TransactionOptions,
  TransactionRow as TransactionRowData,
} from "@/lib/apex/transactions/queries"
import { cn } from "@/lib/utils"
import { TransactionDialog } from "./transaction-dialog"
import { TransactionRowActions } from "./transaction-row-actions"

/**
 * Direction, as a corner badge on the avatar. The avatar says what the money
 * was for; the badge says which way it moved — so a row is readable before
 * the amount is.
 */
const KIND_BADGE: Record<
  TransactionRowData["kind"],
  { icon: LucideIcon; label: string; className: string }
> = {
  income: {
    icon: ArrowDownLeft,
    label: "Income",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  expense: {
    icon: ArrowUpRight,
    label: "Expense",
    className: "bg-muted text-muted-foreground",
  },
  transfer: {
    icon: ArrowLeftRight,
    label: "Transfer",
    className: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  adjustment: {
    icon: RefreshCw,
    label: "Balance sync",
    className: "bg-muted text-muted-foreground",
  },
}

/**
 * One ledger row. The whole row opens the edit dialog — except adjustment
 * rows, which are Sync-balance audit entries and stay view-only. The kebab
 * cell stops propagation so menu clicks never double-trigger the row; the
 * dialog mounts as a sibling of the row so its (portalled) clicks don't
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
  const badge = KIND_BADGE[transaction.kind]

  return (
    <>
      <TableRow
        className={cn("group/row", canEdit && "cursor-pointer")}
        onClick={canEdit ? () => setEditOpen(true) : undefined}
      >
        <TableCell className="w-full max-w-0 py-2 pr-2 pl-3">
          <span className="flex items-center gap-2.5">
            <EntityAvatar
              label={transaction.description}
              icon={avatarIcon(transaction)}
              color={avatarColor(transaction)}
            >
              <AvatarBadge title={badge.label} className={badge.className}>
                <badge.icon />
              </AvatarBadge>
            </EntityAvatar>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">
                {transaction.description}
              </span>
              <span className="truncate text-[12px] text-muted-foreground">
                {sourceLine(transaction)}
              </span>
            </span>
          </span>
        </TableCell>

        <TableCell className="hidden py-2 md:table-cell">
          <CategoryCell row={transaction} />
        </TableCell>

        <TableCell
          className={cn(
            "py-2 pr-2 text-right font-medium whitespace-nowrap tabular-nums",
            amountClass(transaction.kind)
          )}
        >
          {amountText(transaction)}
        </TableCell>

        <TableCell
          className="w-10 py-2 pr-2 text-right"
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
        <TransactionDialog
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

/** Transfers and syncs get fixed iconography; everything else its category's. */
function avatarIcon(row: TransactionRowData): string | null {
  if (row.kind === "transfer") return "arrow-left-right"
  if (row.kind === "adjustment") return "refresh-cw"
  return row.categoryIcon
}

function avatarColor(row: TransactionRowData): string | null {
  if (row.kind === "transfer") return "#0ea5e9"
  if (row.kind === "adjustment") return null
  return row.categoryColor
}

/** Where the money sat: the account, plus the card or the transfer target. */
function sourceLine(row: TransactionRowData): React.ReactNode {
  if (row.kind === "transfer") {
    return `${row.accountName} → ${row.transferAccountName ?? "another account"}`
  }
  if (row.cardLast4) {
    return (
      <>
        {row.accountName}
        <MetaDot />
        {`·${row.cardLast4}`}
      </>
    )
  }
  return row.accountName
}

function CategoryCell({ row }: { row: TransactionRowData }) {
  if (row.kind === "adjustment") {
    return <DataChip>Sync</DataChip>
  }
  if (row.kind === "transfer") {
    return <DataChip color="#0ea5e9">Transfer</DataChip>
  }
  if (!row.categoryName) {
    return <span className="text-[13px] text-muted-foreground">—</span>
  }
  return <DataChip color={row.categoryColor}>{row.categoryName}</DataChip>
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
