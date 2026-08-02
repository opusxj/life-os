import Link from "next/link"
import { Landmark, Plus } from "lucide-react"

import { MarkPaidButton } from "@/components/apex/subscriptions/mark-paid-button"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatPence } from "@/lib/apex/money"
import type { Budget, SavingGoal } from "@/lib/apex/budgets/queries"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type {
  AccountOption,
  RecurringPayment,
} from "@/lib/apex/subscriptions/queries"
import type { OverviewAccount } from "@/lib/apex/overview/queries"
import { cn } from "@/lib/utils"

/** Shared shell for every dashboard card: one question, one bounded answer. */
function OverviewCard({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn("flex flex-col rounded-lg border bg-card p-3.5", className)}
    >
      <h2 className="text-[11px] font-medium text-muted-foreground">{label}</h2>
      {children}
    </section>
  )
}

export function TotalBalanceCard({
  accounts,
  total,
}: {
  accounts: OverviewAccount[]
  total: number
}) {
  return (
    <OverviewCard label="Total balance" className="lg:col-span-2">
      <p
        className={cn(
          "mt-1 text-[26px] font-semibold tracking-tight tabular-nums",
          total < 0 && "text-destructive"
        )}
      >
        {formatPence(total)}
      </p>
      <div className="mt-2.5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center gap-2 text-[13px]"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: account.color }}
            />
            <span className="truncate text-muted-foreground">
              {account.name}
            </span>
            <span
              className={cn(
                "ml-auto tabular-nums",
                account.balance < 0 && "text-destructive"
              )}
            >
              {formatPence(account.balance)}
            </span>
          </div>
        ))}
      </div>
    </OverviewCard>
  )
}

export function DueSoonCard({
  payments,
  payAccounts,
}: {
  payments: RecurringPayment[]
  payAccounts: AccountOption[]
}) {
  return (
    <OverviewCard label="Due soon">
      {payments.length === 0 ? (
        <p className="mt-1 text-[13px] text-muted-foreground">
          {"Nothing due in the next week."}
        </p>
      ) : (
        <div className="mt-1.5 space-y-1.5">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px]">{payment.name}</p>
                <p
                  className={cn(
                    "text-[11px]",
                    dueTone(payment.nextDueOn) === "overdue"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {dueLabel(payment.nextDueOn)}
                </p>
              </div>
              <span className="text-[13px] tabular-nums">
                {formatPence(payment.amount)}
              </span>
              <MarkPaidButton
                paymentId={payment.id}
                accountId={payment.accountId}
                accounts={payAccounts}
              />
            </div>
          ))}
        </div>
      )}
    </OverviewCard>
  )
}

export function MonthCard({
  monthLabel,
  budgets,
}: {
  monthLabel: string
  budgets: Budget[]
}) {
  return (
    <OverviewCard label={`This month · ${monthLabel}`} className="lg:col-span-2">
      {budgets.length === 0 ? (
        <p className="mt-1 text-[13px] text-muted-foreground">
          {"No budgets yet — set envelopes in Budgets & Savings."}
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {budgets.map((budget) => {
            const over = budget.spent > budget.amount
            const pct = Math.min(100, (budget.spent / budget.amount) * 100)
            return (
              <div key={budget.id}>
                <div className="flex items-center gap-2 text-[13px]">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: budget.category.color }}
                  />
                  <span className="truncate">{budget.category.name}</span>
                  <span
                    className={cn(
                      "ml-auto text-[11px] tabular-nums",
                      over ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {over
                      ? `over by ${formatPence(budget.spent - budget.amount)}`
                      : `${formatPence(budget.spent)} of ${formatPence(budget.amount)}`}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", over && "opacity-60")}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: over
                        ? "var(--destructive)"
                        : budget.category.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </OverviewCard>
  )
}

export function SavingsStrip({ goals }: { goals: SavingGoal[] }) {
  if (goals.length === 0) return null
  return (
    <OverviewCard label="Savings" className="lg:col-span-3">
      <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {goals.map((goal) => {
          const pct = Math.min(
            100,
            Math.round((goal.saved / goal.targetAmount) * 100)
          )
          return (
            <div key={goal.id} className="rounded-lg border p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px]">{goal.name}</p>
                <span className="text-[13px] font-semibold tabular-nums">
                  {`${pct}%`}
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: goal.color }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                {`${formatPence(goal.saved)} of ${formatPence(goal.targetAmount)}`}
              </p>
            </div>
          )
        })}
      </div>
    </OverviewCard>
  )
}

export function MortgageSnapshot({ mortgages }: { mortgages: Mortgage[] }) {
  const mortgage = mortgages[0]
  if (!mortgage) return null

  const months = mortgage.rateEndsOn ? monthsUntil(mortgage.rateEndsOn) : null

  return (
    <OverviewCard label="Mortgage">
      <p className="mt-1 text-[22px] font-semibold tracking-tight tabular-nums">
        {formatPence(mortgage.balance)}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {`${mortgage.name} · ${mortgage.lender}`}
      </p>
      {months !== null && (
        <p
          className={cn(
            "mt-2 text-[13px]",
            months < 0
              ? "text-destructive"
              : months < 6
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
          )}
        >
          {months < 0
            ? "Fixed rate has ended"
            : `Rate ends in ${months} ${months === 1 ? "month" : "months"}`}
        </p>
      )}
      {mortgages.length > 1 && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {`+${mortgages.length - 1} more on the Mortgage page`}
        </p>
      )}
    </OverviewCard>
  )
}

export function OverviewEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Landmark />
        </EmptyMedia>
        <EmptyTitle>Apex is ready</EmptyTitle>
        <EmptyDescription>
          {"Add your first account and the dashboard builds itself from there."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" render={<Link href="/apex/accounts" />}>
          <Plus /> Go to Accounts & Cards
        </Button>
      </EmptyContent>
    </Empty>
  )
}

function dueTone(dateKey: string): "overdue" | "upcoming" {
  return dateKey < todayKey() ? "overdue" : "upcoming"
}

function dueLabel(dateKey: string): string {
  const today = todayKey()
  if (dateKey < today) return "overdue"
  if (dateKey === today) return "due today"
  const date = new Date(dateKey)
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function todayKey(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function monthsUntil(dateKey: string): number {
  const target = new Date(dateKey)
  const now = new Date()
  return (
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  )
}
