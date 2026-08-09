import { formatMonthYear } from "@/lib/apex/dates"
import { createServerSupabase } from "@/lib/supabase/server"

export type Budget = {
  id: string
  amount: number
  /** Live expense transactions in the category, current calendar month, pence */
  spent: number
  category: { id: string; name: string; color: string }
}

export type SavingGoal = {
  id: string
  name: string
  targetAmount: number
  /** Linked account balance when linked, saved_amount otherwise, pence */
  saved: number
  targetOn: string | null
  color: string
  account: { id: string; name: string } | null
}

export type CategoryOption = { id: string; name: string; color: string }

/** One slice of the month's spending no envelope watches */
export type OutsidePart = {
  /** Category name, or "No category" for uncategorised spend */
  label: string
  /** The category's own hex; null for the no-category bucket */
  color: string | null
  /** pence */
  amount: number
}

export type AccountOption = {
  id: string
  name: string
  kind: string
  balance: number
}

export type BudgetsPageData = {
  monthLabel: string
  budgets: Budget[]
  /** This month's spend in categories without a live budget, biggest first,
   *  plus a "No category" bucket — the spending the envelopes don't watch */
  outsideBudgets: OutsidePart[]
  goals: SavingGoal[]
  /** Expense categories without a live budget — the New-budget choices */
  budgetableCategories: CategoryOption[]
  /** Savings accounts a goal can link to */
  savingsAccounts: AccountOption[]
  /** All live accounts — Top up source choices */
  accounts: AccountOption[]
}

/** First day of the current month and of the next, as `yyyy-mm-dd` bounds. */
function currentMonthBounds(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0")
  const year = now.getFullYear()
  const month = now.getMonth()
  const start = `${year}-${pad(month + 1)}-01`
  const nextYear = month === 11 ? year + 1 : year
  const nextMonth = month === 11 ? 0 : month + 1
  const end = `${nextYear}-${pad(nextMonth + 1)}-01`
  const label = formatMonthYear(now)
  return { start, end, label }
}

export async function getBudgetsPageData(
  spaceId: string
): Promise<BudgetsPageData> {
  const supabase = await createServerSupabase()
  const { start, end, label } = currentMonthBounds()

  const [
    { data: budgetRows },
    { data: expenseRows },
    { data: goalRows },
    { data: categoryRows },
    { data: accountRows },
  ] = await Promise.all([
    supabase
      .from("budgets")
      .select("id, amount, category_id, categories(id, name, color)")
      .eq("space_id", spaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    // Every live expense this month, uncategorised included: the page states
    // what the envelopes watch AND what slips past them, so nothing here is
    // filtered away.
    supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("space_id", spaceId)
      .eq("kind", "expense")
      .is("deleted_at", null)
      .gte("occurred_on", start)
      .lt("occurred_on", end),
    supabase
      .from("saving_goals")
      .select(
        "id, name, target_amount, saved_amount, target_on, color, account_id, accounts(id, name, balance)"
      )
      .eq("space_id", spaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name, color")
      .eq("space_id", spaceId)
      .eq("kind", "expense")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("accounts")
      .select("id, name, kind, balance")
      .eq("space_id", spaceId)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
  ])

  const spentByCategory = new Map<string, number>()
  let uncategorised = 0
  for (const row of expenseRows ?? []) {
    if (!row.category_id) {
      uncategorised += row.amount
      continue
    }
    spentByCategory.set(
      row.category_id,
      (spentByCategory.get(row.category_id) ?? 0) + row.amount
    )
  }

  const budgets: Budget[] = (budgetRows ?? [])
    .filter((row) => row.categories !== null)
    .map((row) => ({
      id: row.id,
      amount: row.amount,
      spent: spentByCategory.get(row.category_id) ?? 0,
      category: {
        id: row.categories!.id,
        name: row.categories!.name,
        color: row.categories!.color,
      },
    }))

  const goals: SavingGoal[] = (goalRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    saved: row.accounts ? row.accounts.balance : row.saved_amount,
    targetOn: row.target_on,
    color: row.color,
    account: row.accounts
      ? { id: row.accounts.id, name: row.accounts.name }
      : null,
  }))

  const budgeted = new Set(budgets.map((budget) => budget.category.id))
  const budgetableCategories: CategoryOption[] = (categoryRows ?? []).filter(
    (category) => !budgeted.has(category.id)
  )

  // Spend in a soft-deleted category has no live name to stand under, so it
  // joins the no-category bucket rather than vanishing.
  const categoryById = new Map(
    (categoryRows ?? []).map((category) => [category.id, category])
  )
  const outsideBudgets: OutsidePart[] = []
  for (const [categoryId, amount] of spentByCategory) {
    if (budgeted.has(categoryId)) continue
    const category = categoryById.get(categoryId)
    if (category) {
      outsideBudgets.push({
        label: category.name,
        color: category.color,
        amount,
      })
    } else {
      uncategorised += amount
    }
  }
  outsideBudgets.sort((a, b) => b.amount - a.amount)
  if (uncategorised > 0) {
    outsideBudgets.push({
      label: "No category",
      color: null,
      amount: uncategorised,
    })
  }

  const accounts: AccountOption[] = accountRows ?? []
  const savingsAccounts = accounts.filter(
    (account) => account.kind === "savings"
  )

  return {
    monthLabel: label,
    budgets,
    outsideBudgets,
    goals,
    budgetableCategories,
    savingsAccounts,
    accounts,
  }
}
