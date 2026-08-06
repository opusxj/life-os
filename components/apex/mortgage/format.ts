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

/** 50 → "50", 48.5 → "48.5" — share percentages without trailing zeros */
export function formatShare(pct: number): string {
  return String(Number(pct.toFixed(2)))
}
