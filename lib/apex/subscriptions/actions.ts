"use server"

import { parsePoundsToPence } from "@/lib/apex/money"
import { createServerSupabase } from "@/lib/supabase/server"

export type RecurringFormState =
  | { error?: string; success?: boolean }
  | undefined

const KINDS = ["subscription", "bill"] as const
const CADENCES = ["weekly", "monthly", "quarterly", "yearly"] as const

/** Create (no id field) or edit (id present) a subscription/bill. */
export async function saveRecurringPayment(
  _prev: RecurringFormState,
  formData: FormData
): Promise<RecurringFormState> {
  const id = String(formData.get("id") ?? "")
  const spaceId = String(formData.get("spaceId") ?? "")
  const name = String(formData.get("name") ?? "").trim()
  const kind = String(formData.get("kind") ?? "")
  const cadence = String(formData.get("cadence") ?? "")
  const nextDueOn = String(formData.get("nextDueOn") ?? "")
  const accountId = String(formData.get("accountId") ?? "")
  const categoryId = String(formData.get("categoryId") ?? "")
  const amount = parsePoundsToPence(String(formData.get("amount") ?? ""))

  if (!name) return { error: "Give it a name." }
  if (name.length > 80) return { error: "Keep the name under 80 characters." }
  if (!KINDS.includes(kind as (typeof KINDS)[number])) {
    return { error: "Pick subscription or bill." }
  }
  if (amount === null || amount <= 0) {
    return { error: "Enter a valid amount." }
  }
  if (!CADENCES.includes(cadence as (typeof CADENCES)[number])) {
    return { error: "Pick a cadence." }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDueOn)) {
    return { error: "Pick the next due date." }
  }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  const values = {
    name,
    kind,
    amount,
    cadence,
    next_due_on: nextDueOn,
    account_id: accountId || null,
    category_id: categoryId || null,
  }

  const { error } = id
    ? await supabase.from("recurring_payments").update(values).eq("id", id)
    : await supabase
        .from("recurring_payments")
        .insert({ ...values, space_id: spaceId, created_by: user.id })

  if (error) return { error: friendlyDbError(error.message) }
  return { success: true }
}

/**
 * One tap on a due row. The DB function creates the expense transaction and
 * advances next_due_on atomically; accountId overrides for items without a
 * paying account.
 */
export async function markRecurringPaid(
  paymentId: string,
  accountId?: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()
  const { error } = await supabase.rpc("mark_recurring_paid", {
    payment_id: paymentId,
    ...(accountId ? { pay_account: accountId } : {}),
  })
  if (error) return { error: friendlyDbError(error.message) }
  return {}
}

/** Cancel = soft delete; payment history transactions remain. */
export async function cancelRecurringPayment(
  paymentId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  // One UPDATE stamps both columns — RLS rejects an unstamped soft delete
  const { error } = await supabase
    .from("recurring_payments")
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq("id", paymentId)
    .is("deleted_at", null)
  if (error) return { error: friendlyDbError(error.message) }
  return {}
}

function friendlyDbError(message?: string) {
  if (!message) return "Something went wrong. Try again."
  // Strip Postgres error prefixes, keep our own raised messages readable
  return message.replace(/^.*?exception:\s*/i, "")
}
