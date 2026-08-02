// All Apex amounts are integer pence (GBP-only MVP — docs/modules/apex.md).

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
})

/** 208420 → "£2,084.20" (negative pence render with a leading minus) */
export function formatPence(pence: number): string {
  return gbp.format(pence / 100)
}

/** "£2,084.20", "1,250", "12.5" → pence; null when not a valid amount */
export function parsePoundsToPence(input: string): number | null {
  const cleaned = input.replace(/[£,\s]/g, "")
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null
  return Math.round(parseFloat(cleaned) * 100)
}
