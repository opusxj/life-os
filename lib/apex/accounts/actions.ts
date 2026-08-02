"use server"

import { parsePoundsToPence } from "@/lib/apex/money"
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
    const { error } = await supabase
      .from("accounts")
      .update({ name, kind, institution: institution || null, color })
      .eq("id", accountId)
    if (error) return { error: friendlyDbError(error.message) }
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

  return { success: true }
}

export async function deleteAccount(
  accountId: string
): Promise<{ error?: string }> {
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

  const { data: account } = await supabase
    .from("accounts")
    .select("space_id, balance")
    .eq("id", accountId)
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

  const { data: from } = await supabase
    .from("accounts")
    .select("space_id")
    .eq("id", fromId)
    .maybeSingle()
  if (!from) return { error: "Account not found." }

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
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq("id", id)
  if (error) return { error: friendlyDbError(error.message) }
  return {}
}

function friendlyDbError(message?: string) {
  if (!message) return "Something went wrong. Try again."
  return message.replace(/^.*?exception:\s*/i, "")
}
