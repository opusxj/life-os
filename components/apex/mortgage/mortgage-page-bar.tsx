import { History } from "lucide-react"

import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { cn } from "@/lib/utils"

import { AddMortgageButton } from "./add-mortgage-button"
import { UpdateBalancePopover } from "./update-balance-popover"

/**
 * The strip where a page title would normally go. A title here would be the
 * fourth time the screen says "Mortgage", and the cards below already name
 * themselves, so the space goes to the one fact that belongs to the page rather
 * than to any card: how old the balance every projection is built on has got.
 */
export function MortgagePageBar({
  mortgages,
  today,
}: {
  /** Never empty; the empty state replaces the whole page */
  mortgages: Mortgage[]
  /** yyyy-mm-dd resolved server-side so SSR and hydration agree */
  today: string
}) {
  const oldest = mortgages.reduce((left, right) =>
    left.balanceAsOf <= right.balanceAsOf ? left : right
  )
  const days = daysSince(oldest.balanceAsOf, today)
  const only = mortgages.length === 1 ? mortgages[0] : null

  return (
    <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2">
      {/* The page still needs one heading; the cards carry the visible naming */}
      <h1 className="sr-only">Mortgage</h1>

      <p
        className={cn(
          "flex items-center gap-1.5 text-[13px] text-muted-foreground",
          days >= STALE_DAYS && "text-amber-600 dark:text-amber-400"
        )}
      >
        <History className="size-3.5 shrink-0" />
        {freshness(days, oldest.balanceAsOf, today, only === null)}
      </p>

      <div className="flex items-center gap-1.5">
        {only && (
          <UpdateBalancePopover
            mortgageId={only.id}
            balance={only.balance}
            balanceAsOf={only.balanceAsOf}
            today={today}
            variant="outline"
            size="sm"
          />
        )}
        <AddMortgageButton compact />
      </div>
    </div>
  )
}

/** Roughly a statement cycle missed. Past this the projections below are still
 *  arithmetic, but the figure they start from has stopped being evidence. */
const STALE_DAYS = 90

const SHORT_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
})
const SHORT_DATE_YEAR = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

/** Both keys are yyyy-mm-dd, so they parse as UTC midnight and subtract exactly. */
function daysSince(dateKey: string, today: string): number {
  return Math.round((Date.parse(today) - Date.parse(dateKey)) / 86_400_000)
}

function freshness(
  days: number,
  dateKey: string,
  today: string,
  many: boolean
): string {
  const noun = many ? "Oldest balance" : "Balance"

  if (days < 0) return `${noun} dated ${dateLabel(dateKey, today)}`
  if (days === 0) return `${noun} from today`
  if (days === 1) return `${noun} from yesterday`
  if (days < 14) return `${noun} from ${days} days ago`
  return `${noun} from ${dateLabel(dateKey, today)}, ${ago(days)}`
}

function ago(days: number): string {
  if (days < STALE_DAYS) return `${days} days ago`
  const months = Math.round(days / 30.44)
  if (months < 24) return `${months} months ago`
  return `${Math.round(months / 12)} years ago`
}

/** The year only earns its place when the date isn't in the current one, which
 *  is exactly when a bare "24 Nov" would read as eight months in the future. */
function dateLabel(dateKey: string, today: string): string {
  const format =
    dateKey.slice(0, 4) === today.slice(0, 4) ? SHORT_DATE : SHORT_DATE_YEAR
  return format.format(new Date(`${dateKey}T00:00:00`))
}
