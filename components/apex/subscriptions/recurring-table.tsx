"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, XCircle } from "lucide-react"

import { MarkPaidButton } from "@/components/apex/subscriptions/mark-paid-button"
import { RecurringDrawer } from "@/components/apex/subscriptions/recurring-drawer"
import { Button } from "@/components/ui/button"
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
import { cancelRecurringPayment } from "@/lib/apex/subscriptions/actions"
import { formatPence } from "@/lib/apex/money"
import type {
  AccountOption,
  CategoryOption,
  RecurringPayment,
} from "@/lib/apex/subscriptions/queries"
import { cn } from "@/lib/utils"

/** One kind group (subscriptions or bills) as compact 32px rows. */
export function RecurringTable({
  payments,
  accounts,
  categories,
  spaceId,
  today,
  emptyLine,
}: {
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

  if (payments.length === 0) {
    return (
      <div className="rounded-lg bg-card px-3 py-2.5 text-[13px] text-muted-foreground ring-1 ring-foreground/10">
        {emptyLine}
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg bg-card ring-1 ring-foreground/10">
        {payments.map((payment) => {
          const due = dueState(payment.nextDueOn, today)
          return (
            <div
              key={payment.id}
              className="flex h-8 items-center gap-2.5 border-b border-border/60 px-3 text-[13px] last:border-b-0"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                title={payment.categoryName ?? undefined}
                style={{
                  backgroundColor:
                    payment.categoryColor ?? "var(--color-muted-foreground)",
                  opacity: payment.categoryColor ? 1 : 0.35,
                }}
              />
              <span className="min-w-0 flex-1 truncate font-medium">
                {payment.name}
              </span>
              <span className="hidden w-28 truncate text-[11px] text-muted-foreground md:block">
                {payment.accountName ?? "—"}
              </span>
              <span className="hidden w-16 text-[11px] text-muted-foreground sm:block">
                {payment.cadence}
              </span>
              <span
                className={cn(
                  "w-20 shrink-0 text-right text-[12px]",
                  due.overdue ? "font-medium text-destructive" : "text-muted-foreground"
                )}
              >
                {due.label}
              </span>
              <span className="w-18 shrink-0 text-right font-medium tabular-nums">
                {formatPence(payment.amount)}
              </span>
              <span className="flex w-19 shrink-0 justify-end">
                {due.isDue && (
                  <MarkPaidButton
                    paymentId={payment.id}
                    accountId={payment.accountId}
                    accounts={accounts}
                  />
                )}
              </span>
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
                    <DropdownMenuItem onClick={() => setEditing(payment)}>
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
            </div>
          )
        })}
      </div>

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
  if (days < 0) return { label: "overdue", overdue: true, isDue: true }
  if (days === 0) return { label: "due today", overdue: true, isDue: true }
  const label =
    days === 1
      ? "tomorrow"
      : days <= 7
        ? `in ${days} days`
        : shortDate(nextDueOn)
  return { label, overdue: false, isDue: false }
}

const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
})

function shortDate(isoDate: string) {
  return shortDateFormat.format(new Date(`${isoDate}T00:00:00`))
}
