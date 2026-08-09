"use server"

import { todayKey } from "@/lib/apex/dates"
import { parsePoundsToPence } from "@/lib/apex/money"
import { revalidateApex } from "@/lib/apex/revalidate"
import { friendlyDbError } from "@/lib/supabase/errors"
import { createServerSupabase } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase/types"

import { isRecurringPaused, type RecurringCadence } from "./queries"
import { advance } from "./schedule"

export type RecurringFormState =
  { error?: string; success?: boolean } | undefined

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
    // The day the user picked is the intent. Advancing clamps to short months
    // but rebuilds from this, so a 31st bill doesn't walk back to the 28th.
    anchor_day: Number(nextDueOn.slice(8, 10)),
    account_id: accountId || null,
    category_id: categoryId || null,
  }

  // count: "exact" on the update — PostgREST raises no error when RLS or the
  // deleted_at filter removes the row, so a save that wrote nothing used to
  // close the drawer reporting success.
  const { error, count } = id
    ? await supabase
        .from("recurring_payments")
        .update(values, { count: "exact" })
        .eq("id", id)
        .is("deleted_at", null)
    : await supabase
        .from("recurring_payments")
        .insert({ ...values, space_id: spaceId, created_by: user.id })

  if (error) return { error: friendlyDbError(error.message) }
  if (id && count === 0) {
    return { error: "That payment was cancelled or removed, nothing saved." }
  }
  revalidateApex()
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
  revalidateApex()
  return {}
}

/**
 * Pause keeps the row and its history but removes the item from every live
 * answer: totals, due list, projections, badges. Resume rolls a stale due
 * date forward to the first occurrence on or after today via the schedule's
 * anchor rule, so the item starts again on its usual day instead of
 * resurfacing with a pile of phantom overdue payments; a still-future date
 * is kept as it is. The flag is metadata (80% rule), merged so keys this
 * action doesn't own pass through untouched.
 */
export async function setRecurringPaused(
  paymentId: string,
  paused: boolean
): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()
  const { data: existing } = await supabase
    .from("recurring_payments")
    .select("metadata, cadence, next_due_on, anchor_day")
    .eq("id", paymentId)
    .is("deleted_at", null)
    .maybeSingle()
  if (!existing) return { error: "That payment was cancelled or removed." }

  // Resuming a row that is not actually paused must be a no-op: a stale tab's
  // Resume would otherwise roll a genuinely overdue date past a payment that
  // was never recorded. Pausing twice is harmless and falls through.
  if (!paused && !isRecurringPaused(existing.metadata)) {
    return {}
  }

  const metadata: Record<string, Json | undefined> =
    typeof existing.metadata === "object" &&
    existing.metadata !== null &&
    !Array.isArray(existing.metadata)
      ? { ...existing.metadata }
      : {}
  if (paused) metadata["paused"] = true
  else delete metadata["paused"]

  const values: { metadata: Json; next_due_on?: string } = { metadata }
  if (!paused) {
    const today = todayKey()
    const anchor =
      existing.anchor_day ?? Number(existing.next_due_on.slice(8, 10))
    let nextDue = existing.next_due_on
    for (let step = 0; nextDue < today && step < 1000; step++) {
      nextDue = advance(nextDue, existing.cadence as RecurringCadence, anchor)
    }
    if (nextDue !== existing.next_due_on) values.next_due_on = nextDue
  }

  // The next_due_on guard makes the read-compute-write honest under a
  // concurrent edit: if the date moved since the read, count comes back 0
  // and the user retries against fresh state instead of clobbering it.
  const { error, count } = await supabase
    .from("recurring_payments")
    .update(values, { count: "exact" })
    .eq("id", paymentId)
    .eq("next_due_on", existing.next_due_on)
    .is("deleted_at", null)
  if (error) return { error: friendlyDbError(error.message) }
  if (count === 0) {
    return { error: "That payment just changed elsewhere. Try again." }
  }
  revalidateApex()
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
  const { error, count } = await supabase
    .from("recurring_payments")
    .update(
      { deleted_at: new Date().toISOString(), deleted_by: user.id },
      { count: "exact" }
    )
    .eq("id", paymentId)
    .is("deleted_at", null)
  if (error) return { error: friendlyDbError(error.message) }
  if (count === 0) return { error: "That payment is already cancelled." }
  revalidateApex()
  return {}
}

