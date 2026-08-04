"use server"

import { getWorkspace } from "@/lib/data/workspace"
import { formatPence, parsePoundsToPence } from "@/lib/apex/money"
import { revalidateApex } from "@/lib/apex/revalidate"
import { createServerSupabase } from "@/lib/supabase/server"

export type BudgetsFormState = { error?: string; success?: boolean } | undefined

async function requireContext() {
  const workspace = await getWorkspace()
  if (!workspace) return null
  const supabase = await createServerSupabase()
  return {
    supabase,
    spaceId: workspace.activeSpace.id,
    userId: workspace.user.id,
  }
}

function parseAmountField(formData: FormData, field = "amount"): number | null {
  const raw = String(formData.get(field) ?? "").trim()
  const pence = parsePoundsToPence(raw)
  if (pence === null || pence <= 0) return null
  return pence
}

// ------------------------------------------------------------------ budgets

export async function createBudget(
  _prev: BudgetsFormState,
  formData: FormData
): Promise<BudgetsFormState> {
  const categoryId = String(formData.get("categoryId") ?? "")
  const amount = parseAmountField(formData)
  if (!categoryId) return { error: "Pick a category." }
  if (amount === null) return { error: "Enter a monthly amount above zero." }

  const context = await requireContext()
  if (!context) return { error: "Not signed in." }

  const { error } = await context.supabase.from("budgets").insert({
    space_id: context.spaceId,
    category_id: categoryId,
    amount,
    created_by: context.userId,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "That category already has a budget." }
    }
    return { error: friendlyDbError(error.message) }
  }
  revalidateApex()
  return { success: true }
}

export async function updateBudgetAmount(
  _prev: BudgetsFormState,
  formData: FormData
): Promise<BudgetsFormState> {
  const budgetId = String(formData.get("budgetId") ?? "")
  const amount = parseAmountField(formData)
  if (!budgetId) return { error: "Missing budget." }
  if (amount === null) return { error: "Enter a monthly amount above zero." }

  const context = await requireContext()
  if (!context) return { error: "Not signed in." }

  const { error } = await context.supabase
    .from("budgets")
    .update({ amount })
    .eq("id", budgetId)
    .is("deleted_at", null)
  if (error) return { error: friendlyDbError(error.message) }
  revalidateApex()
  return { success: true }
}

export async function removeBudget(
  budgetId: string
): Promise<{ error?: string }> {
  const context = await requireContext()
  if (!context) return { error: "Not signed in." }

  // One UPDATE, stamped: RLS rejects a soft delete without deleted_by
  const { error } = await context.supabase
    .from("budgets")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: context.userId,
    })
    .eq("id", budgetId)
    .is("deleted_at", null)
  if (error) return { error: friendlyDbError(error.message) }
  revalidateApex()
  return {}
}

// ------------------------------------------------------------- saving goals

export async function createSavingGoal(
  _prev: BudgetsFormState,
  formData: FormData
): Promise<BudgetsFormState> {
  const parsed = parseGoalFields(formData)
  if ("error" in parsed) return { error: parsed.error }

  const context = await requireContext()
  if (!context) return { error: "Not signed in." }

  const { error } = await context.supabase.from("saving_goals").insert({
    space_id: context.spaceId,
    created_by: context.userId,
    ...parsed,
  })
  if (error) return { error: friendlyDbError(error.message) }
  revalidateApex()
  return { success: true }
}

export async function updateSavingGoal(
  _prev: BudgetsFormState,
  formData: FormData
): Promise<BudgetsFormState> {
  const goalId = String(formData.get("goalId") ?? "")
  if (!goalId) return { error: "Missing goal." }
  const parsed = parseGoalFields(formData)
  if ("error" in parsed) return { error: parsed.error }

  const context = await requireContext()
  if (!context) return { error: "Not signed in." }

  const { error } = await context.supabase
    .from("saving_goals")
    .update(parsed)
    .eq("id", goalId)
    .is("deleted_at", null)
  if (error) return { error: friendlyDbError(error.message) }
  revalidateApex()
  return { success: true }
}

export async function deleteSavingGoal(
  goalId: string
): Promise<{ error?: string }> {
  const context = await requireContext()
  if (!context) return { error: "Not signed in." }

  const { error } = await context.supabase
    .from("saving_goals")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: context.userId,
    })
    .eq("id", goalId)
    .is("deleted_at", null)
  if (error) return { error: friendlyDbError(error.message) }
  revalidateApex()
  return {}
}

/**
 * Top up moves real money when the goal is linked (a transfer transaction —
 * the DB trigger shifts both balances) and bumps saved_amount when it isn't.
 */
export async function topUpGoal(
  _prev: BudgetsFormState,
  formData: FormData
): Promise<BudgetsFormState> {
  const goalId = String(formData.get("goalId") ?? "")
  const sourceAccountId = String(formData.get("sourceAccountId") ?? "")
  const amount = parseAmountField(formData)
  if (!goalId) return { error: "Missing goal." }
  if (amount === null) return { error: "Enter an amount above zero." }

  const context = await requireContext()
  if (!context) return { error: "Not signed in." }

  const { data: goal } = await context.supabase
    .from("saving_goals")
    .select("id, name, account_id, saved_amount")
    .eq("id", goalId)
    .is("deleted_at", null)
    .maybeSingle()
  if (!goal) return { error: "Goal not found." }

  if (goal.account_id) {
    if (!sourceAccountId)
      return { error: "Pick an account to move money from." }
    if (sourceAccountId === goal.account_id) {
      return { error: "Pick a different source account." }
    }
    // Both ends live, and the source actually holds it. Without this a £5,000
    // top up from an account holding £100 posted silently.
    const { data: source } = await context.supabase
      .from("accounts")
      .select("balance")
      .eq("id", sourceAccountId)
      .is("deleted_at", null)
      .maybeSingle()
    if (!source) return { error: "That source account no longer exists." }
    if (amount > source.balance) {
      return {
        error: `${formatPence(source.balance)} available — that top up is larger.`,
      }
    }
    const { error } = await context.supabase.from("transactions").insert({
      space_id: context.spaceId,
      account_id: sourceAccountId,
      transfer_account_id: goal.account_id,
      kind: "transfer",
      amount,
      description: `Top up ${goal.name}`,
      created_by: context.userId,
    })
    if (error) return { error: friendlyDbError(error.message) }
    return { success: true }
  }

  const { error, count } = await context.supabase
    .from("saving_goals")
    .update({ saved_amount: goal.saved_amount + amount }, { count: "exact" })
    .eq("id", goalId)
    .is("deleted_at", null)
  if (error) return { error: friendlyDbError(error.message) }
  if (count === 0) return { error: "That goal was removed — nothing saved." }
  revalidateApex()
  return { success: true }
}

type GoalFields = {
  name: string
  target_amount: number
  account_id: string | null
  target_on: string | null
  color: string
}

function parseGoalFields(formData: FormData): GoalFields | { error: string } {
  const name = String(formData.get("name") ?? "").trim()
  const target = parseAmountField(formData, "targetAmount")
  const accountId = String(formData.get("accountId") ?? "")
  const targetOn = String(formData.get("targetOn") ?? "").trim()
  const color = String(formData.get("color") ?? "#8b5cf6")

  if (!name) return { error: "Give the goal a name." }
  if (name.length > 60) return { error: "Keep the name under 60 characters." }
  if (target === null) return { error: "Enter a target amount above zero." }
  if (targetOn && !/^\d{4}-\d{2}-\d{2}$/.test(targetOn)) {
    return { error: "Enter the target date as a calendar date." }
  }

  return {
    name,
    target_amount: target,
    account_id: accountId || null,
    target_on: targetOn || null,
    color,
  }
}

function friendlyDbError(message?: string) {
  if (!message) return "Something went wrong. Try again."
  return message.replace(/^.*?exception:\s*/i, "")
}
