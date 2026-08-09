"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  ReceiptText,
  Repeat,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import { ANCHOR_TINTS, TAG_TINTS } from "@/components/apex/anchor-tints"
import { ConfirmDialog } from "@/components/apex/confirm-dialog"
import { DueStateBadge, dueState } from "@/components/apex/due-state"
import { AvatarBadge, EntityAvatar } from "@/components/apex/entity-avatar"
import { MarkPaidButton } from "@/components/apex/subscriptions/mark-paid-button"
import { RecurringDrawer } from "@/components/apex/subscriptions/recurring-drawer"
import {
  DataChip,
  TABLE_HEAD,
  TABLE_STATIC_FOOT,
  TableCard,
  TableCardHeader,
} from "@/components/apex/table-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  cancelRecurringPayment,
  setRecurringPaused,
} from "@/lib/apex/subscriptions/actions"
import { formatDayMonthShort } from "@/lib/apex/dates"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type {
  AccountOption,
  CategoryOption,
  RecurringCadence,
  RecurringKind,
  RecurringPayment,
} from "@/lib/apex/subscriptions/queries"
import { cn } from "@/lib/utils"

/** Per-kind badge meta — tints come from the shared anchor vocabulary. */
const KIND_META: Record<
  RecurringKind,
  { icon: LucideIcon; label: string; className: string }
> = {
  subscription: {
    icon: Repeat,
    label: "Subscription",
    className: ANCHOR_TINTS.subscription,
  },
  bill: {
    icon: ReceiptText,
    label: "Bill",
    className: ANCHOR_TINTS.bill,
  },
}

const CADENCE_SHORT: Record<RecurringCadence, string> = {
  weekly: "wk",
  monthly: "mo",
  quarterly: "qtr",
  yearly: "yr",
}

export type RecurringRow = RecurringPayment & {
  /** Cadence-normalized pence per month, computed server-side */
  monthly: number
}

/** Every subscription and bill in one table, soonest due first across kinds. */
export function RecurringTable({
  payments,
  monthlyTotal,
  lastPaid,
  accounts,
  categories,
  spaceId,
  today,
}: {
  /** Soonest due first — the query's order, kinds interleaved */
  payments: RecurringRow[]
  /** Combined cadence-normalized pence per month; the totals-row figure */
  monthlyTotal: number
  /** Latest Mark paid per payment id (yyyy-mm-dd) */
  lastPaid: Record<string, string>
  accounts: AccountOption[]
  categories: CategoryOption[]
  spaceId: string
  /** yyyy-mm-dd, resolved server-side so SSR and hydration agree */
  today: string
}) {
  const router = useRouter()
  const [editing, setEditing] = React.useState<RecurringPayment | null>(null)
  const [cancelling, setCancelling] = React.useState<RecurringPayment | null>(
    null
  )
  const [cancelError, setCancelError] = React.useState<string | null>(null)
  const [cancelPending, startCancel] = React.useTransition()
  // One inline alert at a time, in the row it belongs to — the same voice as
  // Mark paid's error span. Pausing rarely fails (RLS or a row cancelled
  // elsewhere), so this never earns a dialog.
  const [pauseError, setPauseError] = React.useState<{
    id: string
    message: string
  } | null>(null)
  const [, startPause] = React.useTransition()

  function togglePause(payment: RecurringPayment) {
    setPauseError(null)
    startPause(async () => {
      const result = await setRecurringPaused(payment.id, !payment.paused)
      if (result.error) {
        setPauseError({ id: payment.id, message: result.error })
      } else {
        router.refresh()
      }
    })
  }

  function confirmCancel(payment: RecurringPayment) {
    setCancelError(null)
    startCancel(async () => {
      const result = await cancelRecurringPayment(payment.id)
      if (result.error) {
        setCancelError(result.error)
      } else {
        setCancelling(null)
        router.refresh()
      }
    })
  }

  return (
    <>
      {/* One statement of each fact: the count lives in the page header and
          the monthly total in the foot, where the Amount column reads it. */}
      <TableCard>
        <TableCardHeader title="All recurring" />

        <Table>
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(TABLE_HEAD, "pl-3")}>Name</TableHead>
              <TableHead className={cn(TABLE_HEAD, "hidden md:table-cell")}>
                Category
              </TableHead>
              <TableHead className={TABLE_HEAD}>Next due</TableHead>
              <TableHead className={cn(TABLE_HEAD, "hidden md:table-cell")}>
                Last paid
              </TableHead>
              <TableHead className={cn(TABLE_HEAD, "pr-2 text-right")}>
                Amount
              </TableHead>
              <TableHead className={cn(TABLE_HEAD, "pr-2")}>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const due = dueState(payment.nextDueOn, today)
              const kind = KIND_META[payment.kind]
              return (
                // Dimmed as a whole while paused: a row that doesn't count
                // toward the totals shouldn't read at the same weight as the
                // ones that do.
                <TableRow
                  key={payment.id}
                  className={cn(payment.paused && "opacity-60")}
                >
                  <TableCell className="w-full max-w-0 py-2 pr-2 pl-3">
                    <span className="flex items-center gap-2.5">
                      <EntityAvatar
                        label={payment.name}
                        icon={payment.categoryIcon}
                        color={payment.categoryColor}
                      >
                        <AvatarBadge
                          title={kind.label}
                          className={kind.className}
                        >
                          <kind.icon />
                        </AvatarBadge>
                      </EntityAvatar>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">
                          {payment.name}
                        </span>
                        <span className="truncate text-[12px] text-muted-foreground">
                          {payment.accountName ?? "No account"}
                        </span>
                      </span>
                    </span>
                  </TableCell>

                  <TableCell className="hidden py-2 md:table-cell">
                    {payment.categoryName ? (
                      <DataChip color={payment.categoryColor}>
                        {payment.categoryName}
                      </DataChip>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">
                        —
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-2">
                    {payment.paused ? (
                      <Badge
                        variant="secondary"
                        className={TAG_TINTS.neutral}
                      >
                        Paused
                      </Badge>
                    ) : (
                      <DueStateBadge state={due} />
                    )}
                  </TableCell>

                  {/* The trust column: the reader can see the checklist
                      actually happened. Mark paid stamps every transaction it
                      writes with this row's id; this is that stamp, surfaced. */}
                  <TableCell className="hidden py-2 text-[12px] text-muted-foreground md:table-cell">
                    {lastPaid[payment.id]
                      ? formatDayMonthShort(lastPaid[payment.id])
                      : "—"}
                  </TableCell>

                  <TableCell className="py-2 pr-2 text-right whitespace-nowrap tabular-nums">
                    <span className="font-medium">
                      {payment.cadence === "monthly"
                        ? formatPenceShort(payment.amount)
                        : `${formatPenceShort(payment.amount)} / ${CADENCE_SHORT[payment.cadence]}`}
                    </span>
                    {payment.cadence !== "monthly" && (
                      <span className="block text-[12px] text-muted-foreground">
                        {`${formatPenceShort(payment.monthly)}/mo`}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-2 pr-2">
                    <span className="flex items-center justify-end gap-1">
                      {pauseError?.id === payment.id && (
                        <span
                          role="alert"
                          className="text-[13px] whitespace-nowrap text-destructive"
                        >
                          {pauseError.message}
                        </span>
                      )}
                      {!payment.paused && due.actionable && (
                        <MarkPaidButton
                          paymentId={payment.id}
                          accountId={payment.accountId}
                          accounts={accounts}
                        />
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Actions for ${payment.name}`}
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              onClick={() => setEditing(payment)}
                            >
                              <Pencil />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => togglePause(payment)}
                            >
                              {payment.paused ? <Play /> : <Pause />}
                              {payment.paused ? "Resume" : "Pause"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => {
                                setCancelError(null)
                                setCancelling(payment)
                              }}
                            >
                              <XCircle />
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          {/* Static dress, not TABLE_FOOT: this table rides a normally
              scrolling page, so a sticky foot would pin to the shell's
              viewport instead of sitting under its rows. */}
          <TableFooter className="border-t-0 bg-transparent font-normal">
            <TableRow className="hover:bg-transparent">
              <TableCell
                className={cn(
                  TABLE_STATIC_FOOT,
                  "py-2.5 pl-3 text-[12px] text-muted-foreground"
                )}
              >
                Scaled to a month
              </TableCell>
              <TableCell
                className={cn(TABLE_STATIC_FOOT, "hidden md:table-cell")}
              />
              <TableCell className={TABLE_STATIC_FOOT} />
              <TableCell
                className={cn(TABLE_STATIC_FOOT, "hidden md:table-cell")}
              />
              <TableCell
                className={cn(
                  TABLE_STATIC_FOOT,
                  "py-2.5 pr-2 text-right font-medium whitespace-nowrap tabular-nums"
                )}
              >
                {formatPence(monthlyTotal)}
              </TableCell>
              <TableCell className={TABLE_STATIC_FOOT} />
            </TableRow>
          </TableFooter>
        </Table>
      </TableCard>

      {editing && (
        <RecurringDrawer
          key={editing.id}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null)
          }}
          spaceId={spaceId}
          accounts={accounts}
          categories={categories}
          payment={editing}
        />
      )}

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(open) => {
          if (!open) setCancelling(null)
        }}
        title={`Cancel ${cancelling?.name ?? "this"}?`}
        description="It leaves the schedule; payment history stays."
        confirmLabel="Cancel it"
        pending={cancelPending}
        error={cancelError}
        onConfirm={() => cancelling && confirmCancel(cancelling)}
      />
    </>
  )
}
