// All Apex amounts are integer pence (GBP-only MVP — docs/modules/apex.md).

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
})

/** 208420 → "£2,084.20" (negative pence render with a leading minus) */
export function formatPence(pence: number): string {
  return gbp.format(pence / 100)
}

const gbpWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
})

/**
 * The house display formatter: whole-pound amounts drop the ".00"
 * (£450 not £450.00). Full pence stay in ledger rows and table footers.
 */
export function formatPenceShort(pence: number): string {
  return pence % 100 === 0 ? gbpWhole.format(pence / 100) : formatPence(pence)
}

/** "£2,084.20", "1,250", "12.5" → pence; null when not a valid amount */
export function parsePoundsToPence(input: string): number | null {
  const cleaned = input.replace(/[£,\s]/g, "")
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null
  return Math.round(parseFloat(cleaned) * 100)
}
