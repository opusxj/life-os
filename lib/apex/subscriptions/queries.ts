import { createServerSupabase } from "@/lib/supabase/server"

export type RecurringKind = "subscription" | "bill"
export type RecurringCadence = "weekly" | "monthly" | "quarterly" | "yearly"

export type RecurringPayment = {
  id: string
  name: string
  kind: RecurringKind
  /** pence */
  amount: number
  cadence: RecurringCadence
  /** yyyy-mm-dd */
  nextDueOn: string
  /** Intended day of month (1-31); the advance rule rebuilds from this */
  anchorDay: number | null
  accountId: string | null
  accountName: string | null
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  /** Lucide icon name seeded on the category, e.g. "shopping-basket" */
  categoryIcon: string | null
}

export type AccountOption = { id: string; name: string }
export type CategoryOption = {
  id: string
  name: string
  color: string
  /** Lucide icon name, e.g. "shopping-basket" */
  icon: string | null
}

export type SubscriptionsPageData = {
  /** Live items, soonest due first */
  payments: RecurringPayment[]
  accounts: AccountOption[]
  /** Expense categories only — Mark paid posts an expense */
  categories: CategoryOption[]
  /** Latest Mark paid per item (yyyy-mm-dd), from the transactions it wrote */
  lastPaidByPaymentId: Record<string, string>
}

/** Recurring payments plus the account/category options the drawer needs. */
export async function getSubscriptionsPageData(
  spaceId: string
): Promise<SubscriptionsPageData> {
  const supabase = await createServerSupabase()

  const [
    { data: paymentRows },
    { data: accountRows },
    { data: categoryRows },
    { data: paidRows },
  ] = await Promise.all([
      supabase
        .from("recurring_payments")
        .select(
          "id, name, kind, amount, cadence, next_due_on, anchor_day, account_id, category_id"
        )
        .eq("space_id", spaceId)
        .is("deleted_at", null)
        .order("next_due_on", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("accounts")
        .select("id, name")
        .eq("space_id", spaceId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("categories")
        .select("id, name, color, icon")
        .eq("space_id", spaceId)
        .eq("kind", "expense")
        .is("deleted_at", null)
        .order("name", { ascending: true }),
      // Every Mark paid stamps its transaction with the payment id; newest
      // first, so the first row seen per id is the latest. A household ledger
      // keeps this list small enough to reduce here rather than in an RPC.
      supabase
        .from("transactions")
        .select("recurring_payment_id, occurred_on")
        .eq("space_id", spaceId)
        .not("recurring_payment_id", "is", null)
        .is("deleted_at", null)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false }),
    ])

  const accounts: AccountOption[] = accountRows ?? []
  const categories: CategoryOption[] = categoryRows ?? []
  const accountById = new Map(accounts.map((account) => [account.id, account]))
  const categoryById = new Map(
    categories.map((category) => [category.id, category])
  )

  const payments: RecurringPayment[] = (paymentRows ?? []).map((row) => {
    const account = row.account_id ? accountById.get(row.account_id) : undefined
    const category = row.category_id
      ? categoryById.get(row.category_id)
      : undefined
    return {
      id: row.id,
      name: row.name,
      kind: row.kind === "bill" ? "bill" : "subscription",
      amount: row.amount,
      cadence: toCadence(row.cadence),
      nextDueOn: row.next_due_on,
      anchorDay: row.anchor_day,
      accountId: row.account_id,
      accountName: account?.name ?? null,
      categoryId: row.category_id,
      categoryName: category?.name ?? null,
      categoryColor: category?.color ?? null,
      categoryIcon: category?.icon ?? null,
    }
  })

  const lastPaidByPaymentId: Record<string, string> = {}
  for (const row of paidRows ?? []) {
    if (row.recurring_payment_id && !(row.recurring_payment_id in lastPaidByPaymentId)) {
      lastPaidByPaymentId[row.recurring_payment_id] = row.occurred_on
    }
  }

  return { payments, accounts, categories, lastPaidByPaymentId }
}

const PERIODS_PER_MONTH: Record<RecurringCadence, number> = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
}

/** Normalize any cadence to pence per month, rounded to the penny. */
export function monthlyPence(
  amount: number,
  cadence: RecurringCadence
): number {
  return Math.round(amount * PERIODS_PER_MONTH[cadence])
}

const PERIODS_PER_YEAR: Record<RecurringCadence, number> = {
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
}

/** What a year of renewals costs, exact — whole periods, no rounding. */
export function annualPence(amount: number, cadence: RecurringCadence): number {
  return amount * PERIODS_PER_YEAR[cadence]
}

function toCadence(value: string): RecurringCadence {
  return value === "weekly" || value === "quarterly" || value === "yearly"
    ? value
    : "monthly"
}
