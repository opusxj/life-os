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
import { pluralMonths } from "@/components/apex/mortgage/format"
import { CashflowChart } from "@/components/apex/overview/cashflow-chart"
import { SavingsTile } from "@/components/apex/overview/savings-tile"
import { DataProgress } from "@/components/apex/progress"
import {
  ApexStatCard,
  ApexStatFigure,
  ApexStatHint,
  ApexStatTag,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { MarkPaidButton } from "@/components/apex/subscriptions/mark-paid-button"
import { MetaDot } from "@/components/shared/meta-dot"
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
import { mortgageStatus } from "@/lib/apex/mortgage/status"
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
      description={
        accounts.length === 1
          ? "Your one account's balance"
          : `Net across your ${accounts.length} accounts`
      }
      icon={Wallet}
      iconClassName={ANCHOR_TINTS.balance}
      className={className}
    >
      <ApexStatValue className={cn(total < 0 && "text-destructive")}>
        <ApexStatFigure>{formatPenceShort(total)}</ApexStatFigure>
      </ApexStatValue>
      <Separator className="my-3" />
      <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
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
      description="Recurring payments due in the next week"
      icon={CalendarClock}
      iconClassName={ANCHOR_TINTS.due}
      className={className}
    >
      {payments.length === 0 ? (
        <div className="space-y-2">
          <ApexStatTag tint="balance">
            <CircleCheck className="size-3.5" />
            Nothing due this week
          </ApexStatTag>
          {nextUp && (
            <ApexStatHint className="mt-0">
              {`Next up: ${nextUp.name}`}
              <MetaDot />
              {formatPenceShort(nextUp.amount)}
              <MetaDot />
              {`due ${dueState(nextUp.nextDueOn, today).label}`}
            </ApexStatHint>
          )}
        </div>
      ) : (
        <>
          <ApexStatValue>
            <ApexStatFigure>{formatPenceShort(totalDue)}</ApexStatFigure>{" "}
            <ApexStatUnit>
              {`across ${payments.length} ${payments.length === 1 ? "payment" : "payments"}`}
            </ApexStatUnit>
          </ApexStatValue>
          <Separator className="my-3" />
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
      description="From your transactions over the last six months"
      icon={ArrowDownUp}
      iconClassName={ANCHOR_TINTS.primary}
      className={className}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* The rail is the legend: each bar color named beside the plot,
            with its six-month total, instead of a floating strip below. */}
        <div className="flex shrink-0 gap-6 sm:w-36 sm:flex-col sm:gap-3.5">
          <CashflowLegendRow
            swatchClassName="bg-emerald-700 dark:bg-emerald-600"
            label="Total in"
          >
            {formatPenceShort(totalIn)}
          </CashflowLegendRow>
          <CashflowLegendRow
            swatchClassName="bg-rose-400 dark:bg-rose-500"
            label="Total out"
          >
            {formatPenceShort(totalOut)}
          </CashflowLegendRow>
        </div>
        <div className="min-w-0 flex-1">
          <CashflowChart months={months} />
        </div>
      </div>
    </ApexStatCard>
  )
}

/** One legend entry: the mark's swatch, what it is, and its value. */
function CashflowLegendRow({
  swatchClassName,
  label,
  children,
}: {
  /** Must match the chart's per-theme bar color for the same series */
  swatchClassName: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden
        className={cn("mt-1 size-2.5 shrink-0 rounded-[3px]", swatchClassName)}
      />
      <span className="min-w-0">
        <span className="block text-[12px] leading-snug text-muted-foreground">
          {label}
        </span>
        <span className="block text-sm font-medium tabular-nums">
          {children}
        </span>
      </span>
    </div>
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
      label="This month"
      description={`Spent so far in ${monthLabel}, biggest budgets first`}
      icon={ChartPie}
      iconClassName={ANCHOR_TINTS.bill}
      className={className}
    >
      {budgets.length === 0 ? (
        <ApexStatHint className="mt-0">
          {"No budgets yet. Set envelopes in Budgets & Savings."}
        </ApexStatHint>
      ) : (
        <div className="space-y-3">
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
                  {over ? (
                    <ApexStatTag
                      tint="destructive"
                      className="ml-auto shrink-0"
                    >
                      {`${formatPenceShort(budget.spent - budget.amount)} over`}
                    </ApexStatTag>
                  ) : (
                    <span className="ml-auto text-[13px] text-muted-foreground tabular-nums">
                      {`${formatPenceShort(budget.spent)} of ${formatPenceShort(budget.amount)}`}
                    </span>
                  )}
                </div>
                <DataProgress
                  value={pct}
                  color={over ? "var(--destructive)" : budget.category.color}
                  dim={over}
                  aria-label={`${budget.category.name} budget used`}
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
      description="From linked balances and your top ups"
      icon={PiggyBank}
      iconClassName={ANCHOR_TINTS.balance}
      className={className}
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
  today,
  className,
}: {
  mortgages: Mortgage[]
  /** Server-resolved yyyy-mm-dd, so client and server agree on the date */
  today: string
  className?: string
}) {
  const mortgage = mortgages[0]
  if (!mortgage) return null

  // One source of truth with the Mortgage page: the projected balance and the
  // stage thresholds both come from mortgageStatus, never recomputed here.
  const status = mortgageStatus(mortgage, today)
  const months = status.monthsToRateEnd

  return (
    <ApexStatCard
      label="Mortgage"
      description={
        <>
          {mortgage.name}
          <MetaDot />
          {mortgage.lender}
        </>
      }
      icon={House}
      iconClassName={ANCHOR_TINTS.property}
      className={className}
    >
      <ApexStatValue>
        {formatPenceShort(status.balanceToday)}{" "}
        <ApexStatUnit>still owed</ApexStatUnit>
      </ApexStatValue>
      {months !== null && (
        <div className="mt-2.5">
          {status.stage === "reverted" ? (
            <ApexStatTag tint="destructive">Your deal ended</ApexStatTag>
          ) : months === 0 ? (
            <ApexStatTag tint="due">Your deal ends this month</ApexStatTag>
          ) : status.stage === "act" ? (
            <ApexStatTag tint="due">
              {`Your deal ends in ${pluralMonths(months)}`}
            </ApexStatTag>
          ) : (
            <ApexStatHint className="mt-0">
              {`Your deal ends in ${pluralMonths(months)}`}
            </ApexStatHint>
          )}
        </div>
      )}
      {mortgages.length > 1 && (
        <ApexStatHint className="mt-1.5">
          {`+${mortgages.length - 1} more on the Mortgage page`}
        </ApexStatHint>
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
