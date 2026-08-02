import { getBudgetsPageData, type Budget, type SavingGoal } from "@/lib/apex/budgets/queries"
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
  /** Account choices for Mark paid on items without a paying account */
  payAccounts: AccountOption[]
  mortgages: Mortgage[]
}

/** One glanceable read over every Apex area — composed from the area queries. */
export async function getOverviewData(spaceId: string): Promise<OverviewData> {
  const supabase = await createServerSupabase()

  const [accountRows, budgetsData, subsData, mortgages] = await Promise.all([
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
  ])

  const horizon = new Date()
  horizon.setDate(horizon.getDate() + 7)
  const horizonKey = toDateKey(horizon)

  return {
    accounts: accountRows,
    totalBalance: accountRows.reduce((sum, account) => sum + account.balance, 0),
    monthLabel: budgetsData.monthLabel,
    topBudgets: [...budgetsData.budgets]
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5),
    goals: budgetsData.goals,
    dueSoon: subsData.payments.filter(
      (payment) => payment.nextDueOn <= horizonKey
    ),
    payAccounts: subsData.accounts,
    mortgages,
  }
}

function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
