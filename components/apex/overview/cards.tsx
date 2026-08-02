import Link from "next/link"
import {
  ArrowDownUp,
  CalendarClock,
  ChartPie,
  CircleCheck,
  House,
  Landmark,
  PiggyBank,
  Plus,
  Wallet,
} from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { dueState, DueStateBadge } from "@/components/apex/due-state"
import { CashflowChart } from "@/components/apex/overview/cashflow-chart"
import { SavingsTile } from "@/components/apex/overview/savings-tile"
import { DataProgress } from "@/components/apex/progress"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { MarkPaidButton } from "@/components/apex/subscriptions/mark-paid-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { formatPenceShort } from "@/lib/apex/money"
import type {
  AccountOption as GoalAccountOption,
  Budget,
  SavingGoal,
} from "@/lib/apex/budgets/queries"
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
    <ApexStatCard
      label="Total balance"
      icon={Wallet}
      iconClassName={ANCHOR_TINTS.balance}
      className={cn("shadow-2xs", className)}
    >
      <ApexStatValue className={cn(total < 0 && "text-destructive")}>
        {formatPenceShort(total)}
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
              {formatPenceShort(account.balance)}
            </span>
          </div>
        ))}
      </div>
    </ApexStatCard>
  )
}

export function DueSoonCard({
  payments,
  nextUp,
  payAccounts,
  today,
  className,
}: {
  payments: RecurringPayment[]
  /** First payment beyond the 7-day window — shown when the week is clear */
  nextUp: RecurringPayment | null
  payAccounts: AccountOption[]
  /** Server-resolved yyyy-mm-dd, so client and server agree on the date */
  today: string
  className?: string
}) {
  const totalDue = payments.reduce((sum, payment) => sum + payment.amount, 0)
  return (
    <ApexStatCard
      label="Due soon"
      icon={CalendarClock}
      iconClassName={ANCHOR_TINTS.due}
      className={cn("shadow-2xs", className)}
    >
      {payments.length === 0 ? (
        <div className="space-y-1.5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 py-1 pr-2.5 pl-2 text-[13px] font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CircleCheck className="size-3.5" />
            Nothing due this week
          </span>
          {nextUp && (
            <ApexStatHint className="mt-0">
              {`Next: ${nextUp.name} · ${formatPenceShort(nextUp.amount)} · ${dueState(nextUp.nextDueOn, today).label}`}
            </ApexStatHint>
          )}
        </div>
      ) : (
        <>
          <ApexStatValue>{formatPenceShort(totalDue)}</ApexStatValue>
          <ApexStatHint>
            {`${payments.length} ${payments.length === 1 ? "payment" : "payments"} in the next week.`}
          </ApexStatHint>
          <Separator className="my-2.5" />
          <div className="space-y-1.5">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">{payment.name}</p>
                  <DueStateBadge state={dueState(payment.nextDueOn, today)} />
                </div>
                <span className="text-[13px] tabular-nums">
                  {formatPenceShort(payment.amount)}
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
    <ApexStatCard
      label="Cashflow"
      icon={ArrowDownUp}
      iconClassName={ANCHOR_TINTS.primary}
      className={cn("shadow-2xs", className)}
    >
      <ApexStatHint className="mt-0 mb-3">
        {`${formatPenceShort(totalIn)} in · ${formatPenceShort(totalOut)} out over the last six months.`}
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
      iconClassName={ANCHOR_TINTS.primary}
      className={cn("shadow-2xs", className)}
    >
      {budgets.length === 0 ? (
        <ApexStatHint className="mt-0">
          {"No budgets yet — set envelopes in Budgets & Savings."}
        </ApexStatHint>
      ) : (
        <div className="space-y-2.5">
          {budgets.map((budget) => {
            const over = budget.spent > budget.amount
            // A zero envelope has no meaningful fraction — full when overspent
            const pct =
              budget.amount <= 0
                ? budget.spent > 0
                  ? 100
                  : 0
                : Math.min(100, (budget.spent / budget.amount) * 100)
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
                      "ml-auto text-[13px] tabular-nums",
                      over ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {over
                      ? `over by ${formatPenceShort(budget.spent - budget.amount)}`
                      : `${formatPenceShort(budget.spent)} of ${formatPenceShort(budget.amount)}`}
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

/** Inner tile columns, capped at the goal count so tiles never float in space */
const SAVINGS_COLS = {
  1: "grid gap-2.5",
  2: "grid gap-2.5 sm:grid-cols-2",
  3: "grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-3",
  4: "grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-4",
} as const

export function SavingsStrip({
  goals,
  accounts,
  maxColumns,
  className,
}: {
  goals: SavingGoal[]
  /** Top up source choices — the same options the Budgets page drawer gets */
  accounts: GoalAccountOption[]
  /** Widest the tile grid may go (wider when the strip spans the full row) */
  maxColumns: 3 | 4
  className?: string
}) {
  if (goals.length === 0) return null
  const columns = Math.min(goals.length, maxColumns) as 1 | 2 | 3 | 4
  return (
    <ApexStatCard
      label="Savings"
      icon={PiggyBank}
      iconClassName={ANCHOR_TINTS.balance}
      className={cn("shadow-2xs", className)}
    >
      <div className={SAVINGS_COLS[columns]}>
        {goals.map((goal) => (
          <SavingsTile key={goal.id} goal={goal} accounts={accounts} />
        ))}
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
    <ApexStatCard
      label="Mortgage"
      icon={House}
      iconClassName={ANCHOR_TINTS.balance}
      className={cn("shadow-2xs", className)}
    >
      <ApexStatValue>{formatPenceShort(mortgage.balance)}</ApexStatValue>
      <ApexStatHint>{`${mortgage.name} · ${mortgage.lender}`}</ApexStatHint>
      {months !== null &&
        (months < 0 ? (
          <Badge variant="destructive" className="mt-2">
            Fixed rate has ended
          </Badge>
        ) : months < 6 ? (
          <Badge
            variant="secondary"
            className="mt-2 bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          >
            {`Rate ends in ${months} ${months === 1 ? "month" : "months"}`}
          </Badge>
        ) : (
          <p className="mt-2 text-[13px] text-muted-foreground">
            {`Rate ends in ${months} ${months === 1 ? "month" : "months"}`}
          </p>
        ))}
      {mortgages.length > 1 && (
        <p className="mt-1 text-[13px] text-muted-foreground">
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

function monthsUntil(dateKey: string): number {
  const target = new Date(dateKey)
  const now = new Date()
  return (
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  )
}
