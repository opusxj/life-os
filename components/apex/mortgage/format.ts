// Display helpers local to the Mortgage cards. Amounts stay integer pence
// and format through lib/apex/money; these only shape dates and shares.

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
