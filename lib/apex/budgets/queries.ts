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

export type AccountOption = {
  id: string
  name: string
  kind: string
  balance: number
}

export type BudgetsPageData = {
  monthLabel: string
  budgets: Budget[]
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
  const label = now.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  })
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
    supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("space_id", spaceId)
      .eq("kind", "expense")
      .is("deleted_at", null)
      .not("category_id", "is", null)
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
  for (const row of expenseRows ?? []) {
    if (!row.category_id) continue
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

  const accounts: AccountOption[] = accountRows ?? []
  const savingsAccounts = accounts.filter(
    (account) => account.kind === "savings"
  )

  return {
    monthLabel: label,
    budgets,
    goals,
    budgetableCategories,
    savingsAccounts,
    accounts,
  }
}
