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

import { MarkPaidButton } from "@/components/apex/subscriptions/mark-paid-button"
import { RecurringDrawer } from "@/components/apex/subscriptions/recurring-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { formatPence } from "@/lib/apex/money"
import type {
  AccountOption,
  CategoryOption,
  RecurringKind,
  RecurringPayment,
} from "@/lib/apex/subscriptions/queries"
import { cn } from "@/lib/utils"

const headClass = "h-8 text-[11px] font-medium text-muted-foreground"

/** Icon anchor + tint per kind — client-side so the server page passes only data. */
const KIND_META: Record<
  RecurringKind,
  { icon: LucideIcon; iconClassName: string }
> = {
  subscription: {
    icon: Repeat,
    iconClassName: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  bill: {
    icon: ReceiptText,
    iconClassName: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
}

/** One kind group (subscriptions or bills) as a headed Card around a ui/Table. */
export function RecurringTable({
  title,
  description,
  kind,
  monthlyTotal,
  payments,
  accounts,
  categories,
  spaceId,
  today,
  emptyLine,
}: {
  title: string
  /** One muted support line under the title */
  description: string
  kind: RecurringKind
  /** Cadence-normalized pence per month; the footer total */
  monthlyTotal: number
  payments: RecurringPayment[]
  accounts: AccountOption[]
  categories: CategoryOption[]
  spaceId: string
  /** yyyy-mm-dd, resolved server-side so SSR and hydration agree */
  today: string
  emptyLine: string
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

  const { icon: Icon, iconClassName } = KIND_META[kind]

  const header = (
    <CardHeader className="border-b">
      <CardTitle className="flex items-center gap-1.5">
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-md [&>svg]:size-3",
            iconClassName
          )}
        >
          <Icon />
        </span>
        {title}
      </CardTitle>
      <CardDescription className="text-[13px]">{description}</CardDescription>
      <CardAction>
        <Badge
          variant={kind === "subscription" ? "secondary" : "outline"}
          className="capitalize"
        >
          {kind}
        </Badge>
      </CardAction>
    </CardHeader>
  )

  if (payments.length === 0) {
    return (
      <Card size="sm">
        {header}
        <CardContent className="text-[13px] text-muted-foreground">
          {emptyLine}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card size="sm" className="gap-0 pb-0">
        {header}
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn(headClass, "px-3")}>Name</TableHead>
                <TableHead className={cn(headClass, "hidden md:table-cell")}>
                  Account
                </TableHead>
                <TableHead className={cn(headClass, "hidden sm:table-cell")}>
                  Cadence
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
                    <TableCell className="hidden py-1.5 text-[13px] text-muted-foreground sm:table-cell">
                      {payment.cadence}
                    </TableCell>
                    <TableCell className="py-1.5 text-[13px] text-muted-foreground">
                      {due.status === "overdue" ? (
                        <Badge variant="destructive">{due.label}</Badge>
                      ) : due.status === "today" ? (
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        >
                          {due.label}
                        </Badge>
                      ) : (
                        due.label
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 text-right text-[13px] font-medium tabular-nums">
                      {formatPence(payment.amount)}
                    </TableCell>
                    <TableCell className="px-3 py-1.5">
                      <span className="flex items-center justify-end gap-1">
                        {due.isDue && (
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
                <TableCell className="hidden sm:table-cell" />
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

      <Dialog
        open={cancelling !== null}
        onOpenChange={(open) => {
          if (!open) setCancelling(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{`Cancel ${cancelling?.name ?? "this"}?`}</DialogTitle>
            <DialogDescription>
              {"It leaves the schedule; payment history stays."}
            </DialogDescription>
          </DialogHeader>
          {cancelError && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive"
            >
              {cancelError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCancelling(null)}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={cancelPending}
              onClick={() => cancelling && confirmCancel(cancelling)}
            >
              {cancelPending ? "Cancelling…" : "Cancel it"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function dueState(nextDueOn: string, today: string) {
  const days = Math.round(
    (Date.parse(nextDueOn) - Date.parse(today)) / 86_400_000
  )
  if (days < 0)
    return { status: "overdue" as const, label: "Overdue", isDue: true }
  if (days === 0)
    return { status: "today" as const, label: "Due today", isDue: true }
  const label =
    days === 1
      ? "Tomorrow"
      : days <= 7
        ? `In ${days} days`
        : shortDate(nextDueOn)
  return { status: "upcoming" as const, label, isDue: false }
}

const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
})

function shortDate(isoDate: string) {
  return shortDateFormat.format(new Date(`${isoDate}T00:00:00`))
}
