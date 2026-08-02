import Link from "next/link"
import {
  ArrowDownUp,
  CalendarClock,
  ChartPie,
  House,
  Landmark,
  PiggyBank,
  Plus,
  Wallet,
} from "lucide-react"

import { CashflowChart } from "@/components/apex/overview/cashflow-chart"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { MarkPaidButton } from "@/components/apex/subscriptions/mark-paid-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatPence } from "@/lib/apex/money"
import type { Budget, SavingGoal } from "@/lib/apex/budgets/queries"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type {
  CashflowMonth,
  OverviewAccount,
} from "@/lib/apex/overview/queries"
import type {
  AccountOption,
  RecurringPayment,
} from "@/lib/apex/subscriptions/queries"
import { cn } from "@/lib/utils"

/** ui/Progress with the indicator taking the data color (category, goal). */
function DataProgress({
  value,
  color,
  dim,
  className,
}: {
  value: number
  color: string
  dim?: boolean
  className?: string
}) {
  return (
    <Progress
      value={value}
      className={cn(
        "[&_[data-slot=progress-indicator]]:bg-(--data-color)",
        dim && "[&_[data-slot=progress-indicator]]:opacity-60",
        className
      )}
      style={{ "--data-color": color } as React.CSSProperties}
    />
  )
}

export function TotalBalanceCard({
  accounts,
  total,
  className,
}: {
  accounts: OverviewAccount[]
  total: number
  className?: string
}) {
  return (
    <ApexStatCard label="Total balance" icon={Wallet} className={className}>
      <ApexStatValue className={cn(total < 0 && "text-destructive")}>
        {formatPence(total)}
      </ApexStatValue>
      <ApexStatHint>
        {`Across ${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}.`}
      </ApexStatHint>
      <Separator className="my-2.5" />
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center gap-2 text-[13px]">
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
    </ApexStatCard>
  )
}

export function DueSoonCard({
  payments,
  payAccounts,
  className,
}: {
  payments: RecurringPayment[]
  payAccounts: AccountOption[]
  className?: string
}) {
  const totalDue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  return (
    <ApexStatCard label="Due soon" icon={CalendarClock} className={className}>
      <ApexStatValue>{formatPence(totalDue)}</ApexStatValue>
      {payments.length === 0 ? (
        <ApexStatHint>{"Nothing due in the next week."}</ApexStatHint>
      ) : (
        <>
          <ApexStatHint>
            {`${payments.length} ${payments.length === 1 ? "payment" : "payments"} in the next week.`}
          </ApexStatHint>
          <Separator className="my-2.5" />
          <div className="space-y-1.5">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">{payment.name}</p>
                  <DueState dateKey={payment.nextDueOn} />
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
        </>
      )}
    </ApexStatCard>
  )
}

function DueState({ dateKey }: { dateKey: string }) {
  const today = todayKey()
  if (dateKey < today) return <Badge variant="destructive">Overdue</Badge>
  if (dateKey === today) return <Badge variant="secondary">Due today</Badge>
  return (
    <p className="text-[11px] text-muted-foreground">
      {new Date(dateKey).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })}
    </p>
  )
}

export function CashflowCard({
  months,
  className,
}: {
  months: CashflowMonth[]
  className?: string
}) {
  const totalIn = months.reduce((sum, month) => sum + month.inflow, 0)
  const totalOut = months.reduce((sum, month) => sum + month.outflow, 0)
  return (
    <ApexStatCard label="Cashflow" icon={ArrowDownUp} className={className}>
      <ApexStatHint className="mt-0 mb-3">
        {`${formatPence(totalIn)} in · ${formatPence(totalOut)} out over the last six months.`}
      </ApexStatHint>
      <CashflowChart months={months} />
    </ApexStatCard>
  )
}

export function MonthCard({
  monthLabel,
  budgets,
  className,
}: {
  monthLabel: string
  budgets: Budget[]
  className?: string
}) {
  return (
    <ApexStatCard
      label={`This month · ${monthLabel}`}
      icon={ChartPie}
      className={className}
    >
      {budgets.length === 0 ? (
        <ApexStatHint className="mt-0">
          {"No budgets yet — set envelopes in Budgets & Savings."}
        </ApexStatHint>
      ) : (
        <div className="space-y-2.5">
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
                <DataProgress
                  value={pct}
                  color={over ? "var(--destructive)" : budget.category.color}
                  dim={over}
                  className="mt-1.5"
                />
              </div>
            )
          })}
        </div>
      )}
    </ApexStatCard>
  )
}

export function SavingsStrip({
  goals,
  className,
}: {
  goals: SavingGoal[]
  className?: string
}) {
  if (goals.length === 0) return null
  return (
    <ApexStatCard label="Savings" icon={PiggyBank} className={className}>
      <div className="grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
        {goals.map((goal) => {
          const pct = Math.min(
            100,
            Math.round((goal.saved / goal.targetAmount) * 100)
          )
          return (
            <Card key={goal.id} size="sm" className="gap-0 py-2.5">
              <CardContent className="px-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[13px]">{goal.name}</p>
                  <span className="text-[13px] font-semibold tabular-nums">
                    {`${pct}%`}
                  </span>
                </div>
                <DataProgress
                  value={pct}
                  color={goal.color}
                  className="mt-1.5"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                  {`${formatPence(goal.saved)} of ${formatPence(goal.targetAmount)}`}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </ApexStatCard>
  )
}

export function MortgageSnapshot({
  mortgages,
  className,
}: {
  mortgages: Mortgage[]
  className?: string
}) {
  const mortgage = mortgages[0]
  if (!mortgage) return null

  const months = mortgage.rateEndsOn ? monthsUntil(mortgage.rateEndsOn) : null

  return (
    <ApexStatCard label="Mortgage" icon={House} className={className}>
      <ApexStatValue>{formatPence(mortgage.balance)}</ApexStatValue>
      <ApexStatHint>{`${mortgage.name} · ${mortgage.lender}`}</ApexStatHint>
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
    </ApexStatCard>
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
