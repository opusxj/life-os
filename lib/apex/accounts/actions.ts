"use server"

import { formatPence, parsePoundsToPence } from "@/lib/apex/money"
import { revalidateApex } from "@/lib/apex/revalidate"
import { createServerSupabase } from "@/lib/supabase/server"

export type ApexFormState = { error?: string; success?: boolean } | undefined

const ACCOUNT_KIND_VALUES = [
  "current",
  "savings",
  "credit_card",
  "investment",
  "cash",
] as const

const CARD_BRAND_VALUES = ["visa", "mastercard", "amex", "other"] as const

/** Creates when no accountId in the form, updates otherwise. */
export async function saveAccount(
  _prev: ApexFormState,
  formData: FormData
): Promise<ApexFormState> {
  const accountId = String(formData.get("accountId") ?? "")
  const spaceId = String(formData.get("spaceId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const kind = String(formData.get("kind") ?? "")
  const institution = String(formData.get("institution") ?? "").trim()
  const color = String(formData.get("color") ?? "#10b981")

  if (!name) return { error: "Give the account a name." }
  if (name.length > 60) return { error: "Keep the name under 60 characters." }
  if (!ACCOUNT_KIND_VALUES.includes(kind as never)) {
    return { error: "Pick an account type." }
  }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  if (accountId) {
    // count: "exact" — PostgREST raises no error when RLS filters the row
    // away, so without this a save that wrote nothing reported success.
    const { error, count } = await supabase
      .from("accounts")
      .update(
        { name, kind, institution: institution || null, color },
        { count: "exact" }
      )
      .eq("id", accountId)
      .is("deleted_at", null)
    if (error) return { error: friendlyDbError(error.message) }
    if (count === 0) return { error: "That account no longer exists." }
    return { success: true }
  }

  const startingRaw = String(formData.get("startingBalance") ?? "").trim()
  let startingPence = 0
  if (startingRaw) {
    const parsed = parsePoundsToPence(startingRaw)
    if (parsed === null) {
      return { error: "Starting balance doesn't look like an amount." }
    }
    startingPence = parsed
  }

  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      space_id: spaceId,
      name,
      kind,
      institution: institution || null,
      color,
      created_by: user.id,
    })
    .select("id")
    .single()
  if (error || !account) return { error: friendlyDbError(error?.message) }

  if (startingPence !== 0) {
    // The balance trigger applies the adjustment, so history explains the number
    const { error: txnError } = await supabase.from("transactions").insert({
      space_id: spaceId,
      account_id: account.id,
      kind: "adjustment",
      amount: startingPence,
      description: "Starting balance",
      created_by: user.id,
    })
    if (txnError) return { error: friendlyDbError(txnError.message) }
  }

  revalidateApex()
  return { success: true }
}

/**
 * Refuses while anything still points at the account. Soft-deleting one used
 * to strand its money: the balance left the space total but its transactions
 * stayed in the budgets, its goal read £0 for everyone but the deleter, and
 * the account's own UPDATE policy requires `deleted_at is null` — so it could
 * never be undone. Blocking is the honest answer; there is nowhere for a
 * ledger-backed balance to go.
 */
export async function deleteAccount(
  accountId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()

  const [{ count: txnCount }, { count: cardCount }, { count: goalCount }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .or(`account_id.eq.${accountId},transfer_account_id.eq.${accountId}`)
        .is("deleted_at", null),
      supabase
        .from("cards")
        .select("id", { count: "exact", head: true })
        .eq("account_id", accountId)
        .is("deleted_at", null),
      supabase
        .from("saving_goals")
        .select("id", { count: "exact", head: true })
        .eq("account_id", accountId)
        .is("deleted_at", null),
    ])

  const blockers: string[] = []
  if (txnCount) {
    blockers.push(
      `${txnCount} ${txnCount === 1 ? "transaction" : "transactions"}`
    )
  }
  if (cardCount) {
    blockers.push(`${cardCount} ${cardCount === 1 ? "card" : "cards"}`)
  }
  if (goalCount) {
    blockers.push(`${goalCount} saving ${goalCount === 1 ? "goal" : "goals"}`)
  }
  if (blockers.length > 0) {
    return {
      error: `Still in use by ${blockers.join(", ")}. Move or remove those first — deleting the account would leave their money unaccounted for.`,
    }
  }

  return softDelete("accounts", accountId)
}

export async function saveCard(
  _prev: ApexFormState,
  formData: FormData
): Promise<ApexFormState> {
  const accountId = String(formData.get("accountId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const brand = String(formData.get("brand") ?? "")
  const last4 = String(formData.get("last4") ?? "").trim()
  const expires = String(formData.get("expires") ?? "").trim()
  const color = String(formData.get("color") ?? "#10b981")

  if (!accountId) return { error: "Pick the account this card belongs to." }
  if (!name) return { error: "Give the card a name." }
  if (last4 && !/^\d{4}$/.test(last4)) {
    return { error: "Last four digits means exactly four digits." }
  }
  if (brand && !CARD_BRAND_VALUES.includes(brand as never)) {
    return { error: "Pick a valid card brand." }
  }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  const { data: account } = await supabase
    .from("accounts")
    .select("space_id")
    .eq("id", accountId)
    .maybeSingle()
  if (!account) return { error: "Account not found." }

  const { error } = await supabase.from("cards").insert({
    space_id: account.space_id,
    account_id: accountId,
    name,
    brand: brand || null,
    last4: last4 || null,
    expires_on: expires ? `${expires}-01` : null,
    color,
    created_by: user.id,
  })
  if (error) return { error: friendlyDbError(error.message) }
  revalidateApex()
  return { success: true }
}

export async function deleteCard(cardId: string): Promise<{ error?: string }> {
  return softDelete("cards", cardId)
}

export async function syncBalance(
  _prev: ApexFormState,
  formData: FormData
): Promise<ApexFormState> {
  const accountId = String(formData.get("accountId") ?? "")
  const actualRaw = String(formData.get("actual") ?? "").trim()

  const actual = parsePoundsToPence(actualRaw)
  if (actual === null) {
    return { error: "That doesn't look like an amount." }
  }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  // `deleted_at is null` matters: RLS still returns soft-deleted rows to
  // whoever deleted them, so without this a sync would post into an account
  // nobody can see — the money would leave every total.
  const { data: account } = await supabase
    .from("accounts")
    .select("space_id, balance")
    .eq("id", accountId)
    .is("deleted_at", null)
    .maybeSingle()
  if (!account) return { error: "Account not found." }

  const delta = actual - account.balance
  if (delta === 0) return { success: true }

  const { error } = await supabase.from("transactions").insert({
    space_id: account.space_id,
    account_id: accountId,
    kind: "adjustment",
    amount: delta,
    description: "Balance sync",
    created_by: user.id,
  })
  if (error) return { error: friendlyDbError(error.message) }
  revalidateApex()
  return { success: true }
}

export async function transferBetween(
  _prev: ApexFormState,
  formData: FormData
): Promise<ApexFormState> {
  const fromId = String(formData.get("fromId") ?? "")
  const toId = String(formData.get("toId") ?? "")
  const amountRaw = String(formData.get("amount") ?? "").trim()
  const note = String(formData.get("note") ?? "").trim()

  if (!fromId || !toId) return { error: "Pick both accounts." }
  if (fromId === toId) {
    return { error: "Transfers need two different accounts." }
  }
  const amount = parsePoundsToPence(amountRaw)
  if (amount === null || amount <= 0) {
    return { error: "Enter an amount above zero." }
  }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  // Both ends must be live and in the same space. The destination was never
  // checked, so a transfer into a deleted account was accepted and the money
  // vanished from every total.
  const { data: ends } = await supabase
    .from("accounts")
    .select("id, space_id, balance")
    .in("id", [fromId, toId])
    .is("deleted_at", null)

  const from = ends?.find((account) => account.id === fromId)
  const to = ends?.find((account) => account.id === toId)
  if (!from) return { error: "That source account no longer exists." }
  if (!to) return { error: "That destination account no longer exists." }
  if (from.space_id !== to.space_id) {
    return { error: "Both accounts must be in the same space." }
  }
  if (amount > from.balance) {
    return {
      error: `${formatPence(from.balance)} available — that transfer is larger.`,
    }
  }

  const { error } = await supabase.from("transactions").insert({
    space_id: from.space_id,
    account_id: fromId,
    transfer_account_id: toId,
    kind: "transfer",
    amount,
    description: note || "Transfer",
    created_by: user.id,
  })
  if (error) return { error: friendlyDbError(error.message) }
  revalidateApex()
  return { success: true }
}

async function softDelete(
  table: "accounts" | "cards",
  id: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  // Both stamps in one update — RLS rejects unstamped soft deletes
  const { error, count } = await supabase
    .from(table)
    .update(
      { deleted_at: new Date().toISOString(), deleted_by: user.id },
      { count: "exact" }
    )
    .eq("id", id)
    .is("deleted_at", null)
  if (error) return { error: friendlyDbError(error.message) }
  if (count === 0) return { error: "That's already gone." }
  revalidateApex()
  return {}
}

function friendlyDbError(message?: string) {
  if (!message) return "Something went wrong. Try again."
  return message.replace(/^.*?exception:\s*/i, "")
}
