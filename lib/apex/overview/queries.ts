import {
  getBudgetsPageData,
  type AccountOption as GoalAccountOption,
  type Budget,
  type SavingGoal,
} from "@/lib/apex/budgets/queries"
import { formatMonthYear } from "@/lib/apex/dates"
import { getMortgages, type Mortgage } from "@/lib/apex/mortgage/queries"
import {
  getSubscriptionsPageData,
  type AccountOption,
  type RecurringPayment,
} from "@/lib/apex/subscriptions/queries"
import { createServerSupabase } from "@/lib/supabase/server"

export type OverviewAccount = {
  id: string
  name: string
  kind: string
  balance: number
  color: string
}

export type CashflowMonth = {
  /** "2026-06" */
  month: string
  /** Axis label: "Jun" */
  label: string
  /** Tooltip label: "June 2026" */
  longLabel: string
  /** Live income transactions in the month, pence */
  inflow: number
  /** Live expense transactions in the month, pence */
  outflow: number
}

export type OverviewData = {
  accounts: OverviewAccount[]
  /** Net across all live accounts, pence (credit cards subtract) */
  totalBalance: number
  monthLabel: string
  /** Budgets with live spend, biggest spenders first, capped at five */
  topBudgets: Budget[]
  goals: SavingGoal[]
  /** Recurring payments due within the next 7 days (incl. overdue), soonest first */
  dueSoon: RecurringPayment[]
  /** First payment beyond the 7-day window — the all-clear card's "Next:" line */
  nextUp: RecurringPayment | null
  /** Account choices for Mark paid on items without a paying account */
  payAccounts: AccountOption[]
  /** All live accounts — Top up source choices for the savings tiles */
  goalAccounts: GoalAccountOption[]
  mortgages: Mortgage[]
  /** Income vs expense per calendar month, oldest first — always six entries */
  cashflow: CashflowMonth[]
}

/** One glanceable read over every Apex area — composed from the area queries. */
export async function getOverviewData(spaceId: string): Promise<OverviewData> {
  const supabase = await createServerSupabase()
  const cashflowScaffold = lastSixMonths()

  const [accountRows, budgetsData, subsData, mortgages, cashflowRows] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("id, name, kind, balance, color")
        .eq("space_id", spaceId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .then(({ data }) => data ?? []),
      getBudgetsPageData(spaceId),
      getSubscriptionsPageData(spaceId),
      getMortgages(spaceId),
      supabase
        .from("transactions")
        .select("kind, amount, occurred_on")
        .eq("space_id", spaceId)
        .in("kind", ["income", "expense"])
        .is("deleted_at", null)
        .gte("occurred_on", `${cashflowScaffold[0].month}-01`)
        .then(({ data }) => data ?? []),
    ])

  const horizon = new Date()
  horizon.setDate(horizon.getDate() + 7)
  const horizonKey = toDateKey(horizon)

  // Paused items are not due and never will be until resumed
  const activePayments = subsData.payments.filter((payment) => !payment.paused)

  return {
    accounts: accountRows,
    totalBalance: accountRows.reduce(
      (sum, account) => sum + account.balance,
      0
    ),
    monthLabel: budgetsData.monthLabel,
    topBudgets: [...budgetsData.budgets]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5),
    goals: budgetsData.goals,
    dueSoon: activePayments.filter(
      (payment) => payment.nextDueOn <= horizonKey
    ),
    // Payments arrive soonest-first, so the first one past the horizon is next
    nextUp:
      activePayments.find((payment) => payment.nextDueOn > horizonKey) ?? null,
    payAccounts: subsData.accounts,
    goalAccounts: budgetsData.accounts,
    mortgages,
    cashflow: foldCashflow(cashflowScaffold, cashflowRows),
  }
}

/** The current calendar month and the five before it, oldest first, all zeroed. */
function lastSixMonths(now = new Date()): CashflowMonth[] {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const pad = (n: number) => String(n).padStart(2, "0")
    return {
      month: `${date.getFullYear()}-${pad(date.getMonth() + 1)}`,
      label: date.toLocaleDateString("en-GB", { month: "short" }),
      longLabel: formatMonthYear(date),
      inflow: 0,
      outflow: 0,
    }
  })
}

/** Sum live income/expense rows into the scaffold — empty months keep zero bars. */
function foldCashflow(
  scaffold: CashflowMonth[],
  rows: { kind: string; amount: number; occurred_on: string }[]
): CashflowMonth[] {
  const byMonth = new Map(scaffold.map((entry) => [entry.month, entry]))
  for (const row of rows) {
    const bucket = byMonth.get(row.occurred_on.slice(0, 7))
    if (!bucket) continue
    if (row.kind === "income") bucket.inflow += row.amount
    else bucket.outflow += row.amount
  }
  return scaffold
}

function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
