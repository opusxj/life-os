import { todayKey } from "@/lib/apex/dates"
import { createServerSupabase } from "@/lib/supabase/server"

export const TRANSACTION_KINDS = [
  "income",
  "expense",
  "transfer",
  "adjustment",
] as const

export type TransactionKind = (typeof TRANSACTION_KINDS)[number]

export type TransactionFilters = {
  account?: string
  card?: string
  category?: string
  kind?: TransactionKind
  /** "YYYY-MM"; undefined = all time */
  month?: string
}

export type TransactionRow = {
  id: string
  kind: TransactionKind
  /** Pence; positive with direction from kind, signed for adjustments */
  amount: number
  description: string
  occurredOn: string
  accountId: string
  accountName: string
  transferAccountId: string | null
  transferAccountName: string | null
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  /** Lucide icon name seeded on the category, e.g. "shopping-basket" */
  categoryIcon: string | null
  cardId: string | null
  cardName: string | null
  cardLast4: string | null
}

export type AccountOption = { id: string; name: string; color: string }

export type CardOption = {
  id: string
  name: string
  last4: string | null
  accountId: string
}

export type CategoryOption = {
  id: string
  name: string
  kind: "income" | "expense"
  color: string
  /** Lucide icon name, e.g. "shopping-basket" */
  icon: string | null
}

export type TransactionTotals = {
  /** Pence */
  income: number
  /** Pence */
  expense: number
  transferCount: number
  /** Rows matching the filters — may exceed what `getTransactions` returns */
  rowCount: number
}

export type TransactionOptions = {
  accounts: AccountOption[]
  cards: CardOption[]
  categories: CategoryOption[]
  /** "YYYY-MM" values, newest first, spanning back to the oldest transaction */
  months: string[]
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

// Server-local like every other Apex clock read, never UTC: around midnight
// the default month filter must agree with todayKey and the budget bounds.
export function currentMonth(): string {
  return todayKey().slice(0, 7)
}

/** URL searchParams → validated filters. Month defaults to the current month; `month=all` clears it. */
export function parseTransactionFilters(
  params: Record<string, string | string[] | undefined>
): TransactionFilters {
  const month = first(params.month)
  const kind = first(params.kind)
  return {
    account: asUuid(first(params.account)),
    card: asUuid(first(params.card)),
    category: asUuid(first(params.category)),
    kind: TRANSACTION_KINDS.includes(kind as TransactionKind)
      ? (kind as TransactionKind)
      : undefined,
    month:
      month === "all"
        ? undefined
        : month && MONTH_RE.test(month)
          ? month
          : currentMonth(),
  }
}

/** Accounts, cards and categories of the space, plus the filterable month range. */
export async function getTransactionOptions(
  spaceId: string
): Promise<TransactionOptions> {
  const supabase = await createServerSupabase()

  const [
    { data: accounts },
    { data: cards },
    { data: categories },
    { data: oldest },
  ] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, color")
      .eq("space_id", spaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("cards")
      .select("id, name, last4, account_id")
      .eq("space_id", spaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name, kind, color, icon")
      .eq("space_id", spaceId)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("transactions")
      .select("occurred_on")
      .eq("space_id", spaceId)
      .is("deleted_at", null)
      .order("occurred_on", { ascending: true })
      .limit(1),
  ])

  return {
    accounts: accounts ?? [],
    cards: (cards ?? []).map((card) => ({
      id: card.id,
      name: card.name,
      last4: card.last4,
      accountId: card.account_id,
    })),
    categories: (categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      kind:
        category.kind === "income" ? ("income" as const) : ("expense" as const),
      color: category.color,
      icon: category.icon,
    })),
    months: monthsSince(oldest?.[0]?.occurred_on),
  }
}

/** One page of rows — never the whole set. Totals come from the database. */
export const TRANSACTION_PAGE_SIZE = 500

/**
 * In/Out/counts for the whole filtered set, aggregated in the database.
 * Never derive these from `getTransactions` — that returns at most
 * TRANSACTION_PAGE_SIZE rows, so summing it understates the totals silently.
 */
export async function getTransactionTotals(
  spaceId: string,
  filters: TransactionFilters
): Promise<TransactionTotals> {
  const supabase = await createServerSupabase()

  const { data } = await supabase.rpc("apex_transaction_totals", {
    p_space_id: spaceId,
    p_account: filters.account,
    p_card: filters.card,
    p_category: filters.category,
    p_kind: filters.kind,
    p_from: filters.month ? `${filters.month}-01` : undefined,
    p_to: filters.month ? monthEndExclusive(filters.month) : undefined,
  })

  const row = data?.[0]
  return {
    income: row?.income ?? 0,
    expense: row?.expense ?? 0,
    transferCount: row?.transfer_count ?? 0,
    rowCount: row?.row_count ?? 0,
  }
}

/** The space's live transactions matching the filters, newest first. */
export async function getTransactions(
  spaceId: string,
  filters: TransactionFilters
): Promise<TransactionRow[]> {
  const supabase = await createServerSupabase()

  let query = supabase
    .from("transactions")
    .select(
      `id, kind, amount, description, occurred_on,
       account_id, card_id, category_id, transfer_account_id,
       account:accounts!transactions_account_id_space_id_fkey ( name ),
       transfer_account:accounts!transactions_transfer_account_id_space_id_fkey ( name ),
       category:categories!transactions_category_id_space_id_fkey ( name, color, icon ),
       card:cards!transactions_card_id_account_id_fkey ( name, last4 )`
    )
    .eq("space_id", spaceId)
    .is("deleted_at", null)

  if (filters.account) query = query.eq("account_id", filters.account)
  if (filters.card) query = query.eq("card_id", filters.card)
  if (filters.category) query = query.eq("category_id", filters.category)
  if (filters.kind) query = query.eq("kind", filters.kind)
  if (filters.month) {
    query = query
      .gte("occurred_on", `${filters.month}-01`)
      .lt("occurred_on", monthEndExclusive(filters.month))
  }

  const { data } = await query
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(TRANSACTION_PAGE_SIZE)

  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as TransactionKind,
    amount: row.amount,
    description: row.description,
    occurredOn: row.occurred_on,
    accountId: row.account_id,
    accountName: row.account?.name ?? "Unknown",
    transferAccountId: row.transfer_account_id,
    transferAccountName: row.transfer_account?.name ?? null,
    categoryId: row.category_id,
    categoryName: row.category?.name ?? null,
    categoryColor: row.category?.color ?? null,
    categoryIcon: row.category?.icon ?? null,
    cardId: row.card_id,
    cardName: row.card?.name ?? null,
    cardLast4: row.card?.last4 ?? null,
  }))
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function asUuid(value: string | undefined): string | undefined {
  return value && UUID_RE.test(value) ? value : undefined
}

/** "2026-08" → "2026-09-01" (first day outside the month) */
function monthEndExclusive(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number)
  return new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10)
}

function monthsSince(earliest: string | undefined): string[] {
  // Local clock reads to match currentMonth; Date.UTC below is pure
  // year/month arithmetic on those parts, so no timezone re-enters.
  const now = new Date()
  let count = 1
  if (earliest && MONTH_RE.test(earliest.slice(0, 7))) {
    const [year, monthNumber] = earliest.slice(0, 7).split("-").map(Number)
    const span =
      (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - monthNumber) + 1
    count = Math.min(24, Math.max(1, span))
  }
  return Array.from({ length: count }, (_, index) =>
    new Date(Date.UTC(now.getFullYear(), now.getMonth() - index, 1))
      .toISOString()
      .slice(0, 7)
  )
}
