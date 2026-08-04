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

/**
 * £1bn. Anything larger is a typo, not a household figure — without a ceiling
 * a stray digit was accepted all the way to the ledger (an expense of
 * 999999999999999p drove an account to −£999,999,999,294,615), and beyond
 * bigint it fails with a raw Postgres error instead of a sentence.
 */
export const MAX_PENCE = 100_000_000_000

/**
 * "£2,084.20", "1,250", "12.5" → pence; null when not a valid amount or when
 * it exceeds MAX_PENCE. Note "12,50" parses as £1,250 — commas are stripped as
 * thousands separators, so a European-format paste is a real 100x hazard.
 */
export function parsePoundsToPence(input: string): number | null {
  const cleaned = input.replace(/[£,\s]/g, "")
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const pence = Math.round(parseFloat(cleaned) * 100)
  if (!Number.isSafeInteger(pence) || Math.abs(pence) > MAX_PENCE) return null
  return pence
}
