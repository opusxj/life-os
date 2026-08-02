import { createServerSupabase } from "@/lib/supabase/server"
import type { Tables } from "@/lib/supabase/types"

export type MortgageRateType = "fixed" | "variable" | "tracker"

/** A recognised metadata cost that joins the Monthly cost breakdown. */
export type MortgageExtra = {
  label: string
  /** Monthly cost in pence (annual metadata values are divided by 12) */
  monthly: number
}

export type Mortgage = {
  id: string
  name: string
  lender: string
  originalAmount: number
  balance: number
  interestRate: number
  rateType: MortgageRateType
  rateEndsOn: string | null
  termEndsOn: string
  monthlyPayment: number
  propertyValue: number | null
  equitySharePct: number | null
  rentMonthly: number | null
  extras: MortgageExtra[]
}

/**
 * Metadata keys the Monthly cost card understands (pence values; `_annual`
 * variants are averaged to a monthly figure). Everything else in metadata is
 * left alone — these stay metadata until the 80% promotion rule says otherwise.
 */
const EXTRA_KEYS: { key: string; label: string; annual: boolean }[] = [
  { key: "ground_rent_monthly", label: "Ground rent", annual: false },
  { key: "ground_rent_annual", label: "Ground rent", annual: true },
  { key: "service_charge_monthly", label: "Service charge", annual: false },
  { key: "service_charge_annual", label: "Service charge", annual: true },
]

/** Live mortgages for a space, oldest first. RLS scopes to membership. */
export async function getMortgages(spaceId: string): Promise<Mortgage[]> {
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from("mortgages")
    .select("*")
    .eq("space_id", spaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })

  return (data ?? []).map(toMortgage)
}

function toMortgage(row: Tables<"mortgages">): Mortgage {
  return {
    id: row.id,
    name: row.name,
    lender: row.lender,
    originalAmount: row.original_amount,
    balance: row.balance,
    interestRate: Number(row.interest_rate),
    rateType: toRateType(row.rate_type),
    rateEndsOn: row.rate_ends_on,
    termEndsOn: row.term_ends_on,
    monthlyPayment: row.monthly_payment,
    propertyValue: row.property_value,
    equitySharePct:
      row.equity_share_pct === null ? null : Number(row.equity_share_pct),
    rentMonthly: row.rent_monthly,
    extras: extrasFromMetadata(row.metadata),
  }
}

function toRateType(value: string): MortgageRateType {
  return value === "variable" || value === "tracker" ? value : "fixed"
}

function extrasFromMetadata(
  metadata: Tables<"mortgages">["metadata"]
): MortgageExtra[] {
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    Array.isArray(metadata)
  ) {
    return []
  }
  const extras: MortgageExtra[] = []
  for (const { key, label, annual } of EXTRA_KEYS) {
    const value = metadata[key]
    if (typeof value !== "number" || value <= 0) continue
    extras.push({ label, monthly: annual ? Math.round(value / 12) : value })
  }
  return extras
}
