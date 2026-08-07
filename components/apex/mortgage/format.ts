// Display helpers local to the Mortgage cards. Amounts stay integer pence and
// format through lib/apex/money; dates come from the house vocabulary in
// lib/apex/dates. Only shapes specific to mortgages live here.

export {
  formatDayMonth,
  formatFullDate,
  formatMonthYear,
} from "@/lib/apex/dates"

/** 1 → "1 month", 14 → "14 months" */
export function pluralMonths(count: number): string {
  return count === 1 ? `1 month` : `${count} months`
}

/** 28 → "2 years 4 months", 7 → "7 months", 24 → "2 years". A span long enough
 *  to be worth years is unreadable in months, and nobody counts past 24. */
export function spanWords(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  if (years === 0) return pluralMonths(rest)
  const yearPart = years === 1 ? "1 year" : `${years} years`
  if (rest === 0) return yearPart
  return `${yearPart} ${pluralMonths(rest)}`
}

/** 50 → "50", 48.5 → "48.5" — share percentages without trailing zeros */
export function formatShare(pct: number): string {
  return String(Number(pct.toFixed(2)))
}
