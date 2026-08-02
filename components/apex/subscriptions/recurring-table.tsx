"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Pencil,
  ReceiptText,
  Repeat,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { ConfirmDialog } from "@/components/apex/confirm-dialog"
import { DueStateBadge, dueState } from "@/components/apex/due-state"
import { MarkPaidButton } from "@/components/apex/subscriptions/mark-paid-button"
import { RecurringDrawer } from "@/components/apex/subscriptions/recurring-drawer"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { cancelRecurringPayment } from "@/lib/apex/subscriptions/actions"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type {
  AccountOption,
  CategoryOption,
  RecurringCadence,
  RecurringKind,
  RecurringPayment,
} from "@/lib/apex/subscriptions/queries"
import { cn } from "@/lib/utils"

const headClass = "h-8 text-[13px] font-medium text-muted-foreground"

/** Per-kind icon chip meta — tints come from the shared anchor vocabulary. */
const KIND_META: Record<
  RecurringKind,
  { icon: LucideIcon; label: string; iconClassName: string }
> = {
  subscription: {
    icon: Repeat,
    label: "Subscription",
    iconClassName: ANCHOR_TINTS.subscription,
  },
  bill: {
    icon: ReceiptText,
    label: "Bill",
    iconClassName: ANCHOR_TINTS.bill,
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

function KindChip({ kind }: { kind: RecurringKind }) {
  const { icon: Icon, label, iconClassName } = KIND_META[kind]
  return (
    <span
      title={label}
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-md [&>svg]:size-3",
        iconClassName
      )}
    >
      <Icon />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Every subscription and bill in one table, soonest due first across kinds. */
export function RecurringTable({
  payments,
  monthlyTotal,
  accounts,
  categories,
  spaceId,
  today,
}: {
  /** Soonest due first — the query's order, kinds interleaved */
  payments: RecurringRow[]
  /** Combined cadence-normalized pence per month; the footer total */
  monthlyTotal: number
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
      <Card size="sm" className="gap-0 pb-0">
        <CardHeader className="border-b">
          <CardTitle>All recurring</CardTitle>
          <CardDescription className="text-[13px]">
            Subscriptions and bills together, soonest due first.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn(headClass, "px-3")}>Name</TableHead>
                <TableHead className={cn(headClass, "hidden md:table-cell")}>
                  Account
                </TableHead>
                <TableHead className={headClass}>Next due</TableHead>
                <TableHead className={cn(headClass, "text-right")}>
                  Amount
                </TableHead>
                <TableHead className={cn(headClass, "px-3")}>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const due = dueState(payment.nextDueOn, today)
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="w-full max-w-0 px-3 py-1.5 text-[13px]">
                      <span className="flex items-center gap-2">
                        <KindChip kind={payment.kind} />
                        <span
                          className="size-2 shrink-0 rounded-full"
                          title={payment.categoryName ?? undefined}
                          style={{
                            backgroundColor:
                              payment.categoryColor ??
                              "var(--color-muted-foreground)",
                            opacity: payment.categoryColor ? 1 : 0.35,
                          }}
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {payment.name}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden py-1.5 text-[13px] text-muted-foreground md:table-cell">
                      {payment.accountName ?? "—"}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <DueStateBadge state={due} />
                    </TableCell>
                    <TableCell className="py-1.5 text-right text-[13px] tabular-nums">
                      <span className="font-medium">
                        {payment.cadence === "monthly"
                          ? formatPenceShort(payment.amount)
                          : `${formatPenceShort(payment.amount)} / ${CADENCE_SHORT[payment.cadence]}`}
                      </span>
                      {payment.cadence !== "monthly" && (
                        <span className="text-muted-foreground">
                          {` · ${formatPenceShort(payment.monthly)}/mo`}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-1.5">
                      <span className="flex items-center justify-end gap-1">
                        {due.actionable && (
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
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell className="px-3 py-2 text-[13px]">
                  Monthly total
                </TableCell>
                <TableCell className="hidden md:table-cell" />
                <TableCell />
                <TableCell className="py-2 text-right text-[13px] tabular-nums">
                  {formatPence(monthlyTotal)}
                </TableCell>
                <TableCell className="px-3" />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

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
