// Display helpers local to the Mortgage cards. Amounts stay integer pence
// (lib/apex/money.ts); these only shape how the cards read.

const gbpWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
})

/** 14235000 → "£142,350" — headline figures drop the pennies */
export function formatPounds(pence: number): string {
  return gbpWhole.format(Math.round(pence / 100))
}

const monthYear = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
})

/** "2027-03-31" or a Date → "Mar 2027" */
export function formatMonthYear(date: string | Date): string {
  return monthYear.format(
    typeof date === "string" ? new Date(`${date}T00:00:00`) : date
  )
}

/** 1 → "1 month", 14 → "14 months" */
export function pluralMonths(count: number): string {
  return count === 1 ? `1 month` : `${count} months`
}

/** 50 → "50", 48.5 → "48.5" — share percentages without trailing zeros */
export function formatShare(pct: number): string {
  return String(Number(pct.toFixed(2)))
}

/** Subtle Apex-emerald tint for the stat-card icon anchors on this page. */
export const EMERALD_ANCHOR =
  "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
