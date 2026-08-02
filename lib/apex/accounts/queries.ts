import { createServerSupabase } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/types"

export type Account = Tables<"accounts">
export type BankCard = Tables<"cards">
export type AccountWithCards = Account & { cards: BankCard[] }

export async function getAccountsWithCards(
  spaceId: string
): Promise<AccountWithCards[]> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from("accounts")
    .select("*, cards(*)")
    .eq("space_id", spaceId)
    .is("deleted_at", null)
    .is("cards.deleted_at", null)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data ?? []).map((account) => ({
    ...account,
    cards: [...account.cards].sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    ),
  }))
}
