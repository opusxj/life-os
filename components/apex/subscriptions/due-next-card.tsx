import { CalendarClock } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { duePill, dueState } from "@/components/apex/due-state"
import {
  ApexCardFootnote,
  ApexStatCard,
  ApexStatFigure,
  ApexStatHint,
  ApexStatTag,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type { RecurringPayment } from "@/lib/apex/subscriptions/queries"
import { DUE_SOON_DAYS } from "@/lib/apex/subscriptions/schedule"

/**
 * The first payment on the schedule, in the house due-language. Because the
 * query sorts soonest first, an overdue item IS the first row, so the card
 * escalates by itself. The footnote teaches what the one-tap does — record
 * the expense and move the date on — which is exactly what the
 * mark_recurring_paid RPC does, so the copy claims nothing unbuilt.
 */
export function DueNextCard({
  payments,
  today,
  className,
}: {
  /** Soonest due first — the query's order */
  payments: RecurringPayment[]
  /** yyyy-mm-dd resolved server-side so SSR and hydration agree */
  today: string
  className?: string
}) {
  const next = payments.at(0)
  if (!next) return null

  const due = dueState(next.nextDueOn, today)
  const pill = duePill(due)
  const others = payments.filter((payment) => {
    if (payment.id === next.id) return false
    const days = dueState(payment.nextDueOn, today).days
    // 0 to the window only: a second overdue item is not "due within a week"
    return days >= 0 && days <= DUE_SOON_DAYS
  })
  const othersTotal = others.reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <ApexStatCard
      label="Due next"
      description="The first payment on the schedule"
      icon={CalendarClock}
      iconClassName={ANCHOR_TINTS.due}
      className={className}
    >
      <ApexStatValue className="truncate">
        <ApexStatFigure>{formatPenceShort(next.amount)}</ApexStatFigure>{" "}
        <ApexStatUnit>{`to ${next.name}`}</ApexStatUnit>
      </ApexStatValue>
      <div className="mt-2.5">
        <ApexStatTag tint={pill.tint}>{pill.label}</ApexStatTag>
      </div>
      {others.length > 0 && (
        <ApexStatHint className="mt-2.5">
          {others.length === 1
            ? `1 more due within a week, ${formatPence(othersTotal)}.`
            : `${others.length} more due within a week, ${formatPence(othersTotal)} between them.`}
        </ApexStatHint>
      )}
      {due.actionable && (
        <ApexCardFootnote>
          Marking it paid records the expense and moves the date on.
        </ApexCardFootnote>
      )}
    </ApexStatCard>
  )
}
