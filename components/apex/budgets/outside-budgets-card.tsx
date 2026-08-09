import { EyeOff } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexCardFootnote,
  ApexStatCard,
  ApexStatFigure,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { formatPence } from "@/lib/apex/money"
import type { OutsidePart } from "@/lib/apex/budgets/queries"
import { cn } from "@/lib/utils"

/** Rows beyond this fold into one drawn-neutral "Everything else". */
const TOP = 3

/**
 * The honesty card. The old page summed only budgeted categories, so a month
 * could read green while hundreds flowed past the envelopes unwatched — the
 * silent failure the mortgage bar's "fail loudly" rule exists to prevent.
 * Sky, not amber or red: unbudgeted is not bad, only unwatched, and the
 * footnote is the action. Zero unbudgeted spend returns null and the row
 * closes up; never a grey £0.
 */
export function OutsideBudgetsCard({
  parts,
  monthName,
  className,
}: {
  /** Unbudgeted spend by category, biggest first (queries.ts) */
  parts: OutsidePart[]
  /** Bare spelled month ("August") */
  monthName: string
  className?: string
}) {
  const total = parts.reduce((sum, part) => sum + part.amount, 0)
  if (total <= 0) return null

  // color === null is the bucket's discriminator (queries.ts), never the
  // label: a user is free to name a real category "No category".
  const named = parts.filter((part) => part.color !== null)
  const noCategory = parts.find((part) => part.color === null)
  const top = named.slice(0, TOP)
  const restTotal = named
    .slice(TOP)
    .reduce((sum, part) => sum + part.amount, 0)

  return (
    <ApexStatCard
      label="Outside your budgets"
      description={`${monthName} spending in categories with no budget`}
      icon={EyeOff}
      iconClassName={ANCHOR_TINTS.bill}
      className={className}
    >
      <ApexStatValue>
        <ApexStatFigure>{formatPence(total)}</ApexStatFigure>
      </ApexStatValue>

      <div className="mt-2.5 space-y-1.5">
        {top.map((part, index) => (
          <Row
            key={index}
            label={part.label}
            color={part.color}
            amount={part.amount}
          />
        ))}
        {restTotal > 0 && (
          <Row label="Everything else" color={null} amount={restTotal} />
        )}
        {noCategory && (
          <Row
            label="No category"
            color={null}
            amount={noCategory.amount}
          />
        )}
      </div>

      <ApexCardFootnote>
        New budget above puts an envelope on any of these.
      </ApexCardFootnote>
    </ApexStatCard>
  )
}

/** The identity-dot row: the category's own hex names the row, the drawn
 *  neutral (slate, monthly-cost precedent) covers the folds. */
function Row({
  label,
  color,
  amount,
}: {
  label: string
  color: string | null
  amount: number
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
        <span
          aria-hidden
          className={cn("size-2 shrink-0 rounded-full", !color && "bg-slate-500")}
          style={color ? { backgroundColor: color } : undefined}
        />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 text-[13px] font-medium tabular-nums">
        {formatPence(amount)}
      </span>
    </div>
  )
}
