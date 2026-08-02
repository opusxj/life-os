import {
  getTransactionOptions,
  type TransactionOptions,
} from "@/lib/apex/transactions/queries"
import { createServerSupabase } from "@/lib/supabase/server"

export type ApexSidebarAccount = {
  id: string
  name: string
  color: string
  balance: number
}

export type ApexNavBadge = { count: number; tone: "destructive" | "amber" }

export type ApexSidebarData = {
  /** Feeds the quick-add transaction drawer */
  txnOptions: TransactionOptions
  accounts: ApexSidebarAccount[]
  totalBalance: number
  /** Signed pence: this calendar month's net effect on the total */
  monthNet: number
  /** Due within 7 days (incl. overdue); null when nothing needs attention */
  dueBadge: ApexNavBadge | null
  overBudgetCount: number
  /** The most urgent recurring payment (overdue first, then soonest) */
  nextDue: {
    id: string
    name: string
    amount: number
    nextDueOn: string
    accountId: string | null
  } | null
}

/** One light fetch powering the live Apex sidebar (badges, accounts, footer). */
export async function getApexSidebarData(
  spaceId: string
): Promise<ApexSidebarData> {
  const supabase = await createServerSupabase()
  const monthStart = toDateKey(startOfMonth(new Date()))
  const horizon = toDateKey(addDays(new Date(), 7))
  const today = toDateKey(new Date())

  const [txnOptions, accountRows, monthRows, recurringRows, budgetRows] =
    await Promise.all([
      getTransactionOptions(spaceId),
      supabase
        .from("accounts")
        .select("id, name, color, balance")
        .eq("space_id", spaceId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .then(({ data }) => data ?? []),
      supabase
        .from("transactions")
        .select("kind, amount, category_id")
        .eq("space_id", spaceId)
        .is("deleted_at", null)
        .gte("occurred_on", monthStart)
        .then(({ data }) => data ?? []),
      supabase
        .from("recurring_payments")
        .select("id, name, amount, next_due_on, account_id")
        .eq("space_id", spaceId)
        .is("deleted_at", null)
        .order("next_due_on", { ascending: true })
        .then(({ data }) => data ?? []),
      supabase
        .from("budgets")
        .select("category_id, amount")
        .eq("space_id", spaceId)
        .is("deleted_at", null)
        .then(({ data }) => data ?? []),
    ])

  let monthNet = 0
  const spentByCategory = new Map<string, number>()
  for (const row of monthRows) {
    if (row.kind === "income") monthNet += row.amount
    else if (row.kind === "expense") {
      monthNet -= row.amount
      if (row.category_id) {
        spentByCategory.set(
          row.category_id,
          (spentByCategory.get(row.category_id) ?? 0) + row.amount
        )
      }
    } else if (row.kind === "adjustment") monthNet += row.amount
    // transfers move money between accounts; the total is untouched
  }

  const due = recurringRows.filter((row) => row.next_due_on <= horizon)
  const overdue = due.some((row) => row.next_due_on < today)
  const next = recurringRows[0]

  const overBudgetCount = budgetRows.filter(
    (budget) => (spentByCategory.get(budget.category_id) ?? 0) > budget.amount
  ).length

  return {
    txnOptions,
    accounts: accountRows,
    totalBalance: accountRows.reduce((sum, account) => sum + account.balance, 0),
    monthNet,
    dueBadge:
      due.length > 0
        ? { count: due.length, tone: overdue ? "destructive" : "amber" }
        : null,
    overBudgetCount,
    nextDue: next
      ? {
          id: next.id,
          name: next.name,
          amount: next.amount,
          nextDueOn: next.next_due_on,
          accountId: next.account_id,
        }
      : null,
  }
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
