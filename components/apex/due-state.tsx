import { Badge } from "@/components/ui/badge"
import { formatWeekdayDateShort } from "@/lib/apex/dates"
import { cn } from "@/lib/utils"

export type DueState = {
  days: number
  status: "overdue" | "today" | "upcoming"
  label: string
  /** Mark paid is offered inside this window */
  actionable: boolean
}

/**
 * The one due-language for every surface (page tables, overview card,
 * sidebar): pass a server-resolved `today` key so client and server agree
 * on the date. Overdue → destructive badge, Due today → amber badge,
 * within a week → relative text, beyond → "Mon 3 Aug".
 */
export function dueState(nextDueOn: string, today: string): DueState {
  const days = Math.round(
    (Date.parse(nextDueOn) - Date.parse(today)) / 86_400_000
  )
  if (days < 0)
    return { days, status: "overdue", label: "Overdue", actionable: true }
  if (days === 0)
    return { days, status: "today", label: "Due today", actionable: true }
  const label =
    days === 1
      ? "Due tomorrow"
      : days <= 7
        ? `Due in ${days} days`
        : shortDate(nextDueOn)
  return { days, status: "upcoming", label, actionable: days <= 7 }
}

export function DueStateBadge({
  state,
  className,
}: {
  state: DueState
  className?: string
}) {
  if (state.status === "overdue") {
    return (
      <Badge variant="destructive" className={className}>
        {state.label}
      </Badge>
    )
  }
  if (state.status === "today") {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
          className
        )}
      >
        {state.label}
      </Badge>
    )
  }
  return (
    <span className={cn("text-[13px] text-muted-foreground", className)}>
      {state.label}
    </span>
  )
}

export function todayKey(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** Badges sit in table rows, so this is one of the surfaces allowed to
 *  shorten the month; the ordinal stays either way (lib/apex/dates). */
function shortDate(dateKey: string): string {
  return formatWeekdayDateShort(dateKey)
}
