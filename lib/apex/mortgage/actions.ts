"use server"

import { revalidatePath } from "next/cache"

import { parsePoundsToPence } from "@/lib/apex/money"
import { getWorkspace } from "@/lib/data/workspace"
import { createServerSupabase } from "@/lib/supabase/server"
import type { TablesInsert } from "@/lib/supabase/types"

export type MortgageFormState =
  { error?: string; success?: boolean } | undefined

const RATE_TYPES = ["fixed", "variable", "tracker"] as const

export async function createMortgage(
  _prev: MortgageFormState,
  formData: FormData
): Promise<MortgageFormState> {
  const parsed = parseMortgageForm(formData)
  if ("error" in parsed) return { error: parsed.error }

  const workspace = await getWorkspace()
  if (!workspace) return { error: "Not signed in." }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from("mortgages").insert({
    ...parsed.values,
    space_id: workspace.activeSpace.id,
    created_by: workspace.user.id,
  } satisfies TablesInsert<"mortgages">)

  if (error) return { error: friendlyDbError(error.message) }

  revalidatePath("/apex/mortgage")
  return { success: true }
}

export async function updateMortgage(
  _prev: MortgageFormState,
  formData: FormData
): Promise<MortgageFormState> {
  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing mortgage." }

  const parsed = parseMortgageForm(formData)
  if ("error" in parsed) return { error: parsed.error }

  const supabase = await createServerSupabase()

  // Only re-date the balance when the balance itself moved. Renaming a mortgage
  // must not make a six-month-old figure start claiming to be today's.
  const { data: existing } = await supabase
    .from("mortgages")
    .select("balance")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()

  const values =
    existing && existing.balance !== parsed.values.balance
      ? { ...parsed.values, balance_as_of: serverToday() }
      : parsed.values

  const { error, count } = await supabase
    .from("mortgages")
    .update(values, { count: "exact" })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) return { error: friendlyDbError(error.message) }
  if (count === 0) return { error: "Mortgage not found." }

  revalidatePath("/apex/mortgage")
  return { success: true }
}

/** The balance quick action. Mortgages are manually maintained, so this is a
 *  plain column update; it never touches accounts or transactions. */
export async function updateMortgageBalance(
  _prev: MortgageFormState,
  formData: FormData
): Promise<MortgageFormState> {
  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing mortgage." }

  const balance = parsePoundsToPence(String(formData.get("balance") ?? ""))
  if (balance === null || balance < 0) {
    return { error: "Enter the current balance as a positive amount." }
  }

  // Every projection on the page ages this figure forward from its date, so a
  // balance saved without one keeps insisting it is current. Statements are
  // dated and usually a few days old, hence the field rather than always today.
  const today = serverToday()
  const balanceAsOf = parseDate(formData.get("balanceAsOf")) ?? today
  if (balanceAsOf > today) {
    return { error: "A statement can't be dated in the future." }
  }

  const supabase = await createServerSupabase()
  const { error, count } = await supabase
    .from("mortgages")
    .update({ balance, balance_as_of: balanceAsOf }, { count: "exact" })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) return { error: friendlyDbError(error.message) }
  if (count === 0) return { error: "Mortgage not found." }

  revalidatePath("/apex/mortgage")
  return { success: true }
}

/** Soft delete per data-standards: one UPDATE stamping both audit columns. */
export async function deleteMortgage(id: string): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  const { error, count } = await supabase
    .from("mortgages")
    .update(
      { deleted_at: new Date().toISOString(), deleted_by: user.id },
      { count: "exact" }
    )
    .eq("id", id)
    .is("deleted_at", null)

  if (error) return { error: friendlyDbError(error.message) }
  if (count === 0) return { error: "Mortgage not found." }

  revalidatePath("/apex/mortgage")
  return {}
}

type ParsedMortgage =
  | { error: string }
  | {
      values: {
        name: string
        lender: string
        original_amount: number
        balance: number
        interest_rate: number
        rate_type: string
        rate_ends_on: string | null
        term_ends_on: string
        monthly_payment: number
        property_value: number | null
        equity_share_pct: number | null
        rent_monthly: number | null
      }
    }

function parseMortgageForm(formData: FormData): ParsedMortgage {
  const name = String(formData.get("name") ?? "").trim()
  const lender = String(formData.get("lender") ?? "").trim()
  if (!name) return { error: "Give the mortgage a name." }
  if (name.length > 80) return { error: "Keep the name under 80 characters." }
  if (!lender) return { error: "Who's the lender?" }

  const originalAmount = parsePoundsToPence(
    String(formData.get("originalAmount") ?? "")
  )
  if (originalAmount === null || originalAmount <= 0) {
    return { error: "Enter the original amount borrowed." }
  }

  const balance = parsePoundsToPence(String(formData.get("balance") ?? ""))
  if (balance === null || balance < 0) {
    return { error: "Enter the current balance." }
  }

  const rateRaw = String(formData.get("interestRate") ?? "").trim()
  const interestRate = /^\d{1,3}(\.\d{1,2})?$/.test(rateRaw)
    ? parseFloat(rateRaw)
    : null
  if (interestRate === null || interestRate >= 100) {
    return { error: "Enter the interest rate as a percentage, like 4.79." }
  }

  const rateType = String(formData.get("rateType") ?? "")
  if (!RATE_TYPES.includes(rateType as (typeof RATE_TYPES)[number])) {
    return { error: "Pick a rate type." }
  }

  const termEndsOn = parseDate(formData.get("termEndsOn"))
  if (!termEndsOn) return { error: "When does the term end?" }

  const monthlyPayment = parsePoundsToPence(
    String(formData.get("monthlyPayment") ?? "")
  )
  if (monthlyPayment === null || monthlyPayment <= 0) {
    return { error: "Enter the monthly payment." }
  }

  const rateEndsOn = parseDate(formData.get("rateEndsOn"))

  const propertyValueRaw = String(formData.get("propertyValue") ?? "").trim()
  const propertyValue = propertyValueRaw
    ? parsePoundsToPence(propertyValueRaw)
    : null
  if (propertyValueRaw && (propertyValue === null || propertyValue <= 0)) {
    return {
      error: "Enter the property value as an amount, or leave it blank.",
    }
  }

  const shareRaw = String(formData.get("equitySharePct") ?? "").trim()
  let equitySharePct: number | null = null
  if (shareRaw) {
    equitySharePct = /^\d{1,3}(\.\d{1,2})?$/.test(shareRaw)
      ? parseFloat(shareRaw)
      : null
    if (
      equitySharePct === null ||
      equitySharePct <= 0 ||
      equitySharePct > 100
    ) {
      return { error: "Equity share must be between 0 and 100." }
    }
  }

  const rentRaw = String(formData.get("rentMonthly") ?? "").trim()
  const rentMonthly = rentRaw ? parsePoundsToPence(rentRaw) : null
  if (rentRaw && (rentMonthly === null || rentMonthly <= 0)) {
    return { error: "Enter the monthly rent as an amount, or leave it blank." }
  }

  return {
    values: {
      name,
      lender,
      original_amount: originalAmount,
      balance,
      interest_rate: interestRate,
      rate_type: rateType,
      rate_ends_on: rateEndsOn,
      term_ends_on: termEndsOn,
      monthly_payment: monthlyPayment,
      property_value: propertyValue,
      equity_share_pct: equitySharePct,
      rent_monthly: rentMonthly,
    },
  }
}

function parseDate(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
}

/** yyyy-mm-dd in the server's timezone. These columns are calendar days rather
 *  than instants, so they never go via toISOString. */
function serverToday(): string {
  const now = new Date()
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function friendlyDbError(message?: string) {
  if (!message) return "Something went wrong. Try again."
  return message.replace(/^.*?exception:\s*/i, "")
}
