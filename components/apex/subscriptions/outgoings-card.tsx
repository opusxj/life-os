import { Banknote } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  MeterLegendRow,
  MeterTotalRow,
  SegmentMeter,
} from "@/components/apex/meter"
import {
  ApexCardFootnote,
  ApexStatCard,
  ApexStatFigure,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { formatPence } from "@/lib/apex/money"

/** The two kinds, in the vocabulary they own everywhere: sky the committed
 *  cost, violet the optional recurring spend. */
const BILLS_COLOR = "bg-sky-500"
const SUBSCRIPTIONS_COLOR = "bg-violet-500"

/**
 * The page's headline answer: what leaves the account a month, all in, and
 * how much of that is chosen versus committed. The annually row is the
 * monthly-cost card's total-row grammar, because for this audience "£358.97
 * a month" hides that a year of it is four grand.
 */
export function OutgoingsCard({
  billsMonthly,
  subscriptionsMonthly,
  annualTotal,
  className,
}: {
  /** Cadence-normalized pence per month, by kind */
  billsMonthly: number
  subscriptionsMonthly: number
  /** Exact pence per year of whole renewals, not monthly × 12 */
  annualTotal: number
  className?: string
}) {
  const total = billsMonthly + subscriptionsMonthly
  const parts = [
    { label: "Bills", amount: billsMonthly, color: BILLS_COLOR },
    {
      label: "Subscriptions",
      amount: subscriptionsMonthly,
      color: SUBSCRIPTIONS_COLOR,
    },
  ].filter((part) => part.amount > 0)

  return (
    <ApexStatCard
      label="Outgoings"
      description="Everything on the schedule, scaled to a month"
      icon={Banknote}
      iconClassName={ANCHOR_TINTS.primary}
      className={className}
    >
      <ApexStatValue>
        <ApexStatFigure>{formatPence(total)}</ApexStatFigure>{" "}
        <ApexStatUnit>a month</ApexStatUnit>
      </ApexStatValue>

      {/* One kind is not a composition: a single-segment meter is a filled
          bar announcing 100%, so bills-only or subs-only stays hero-only. */}
      {parts.length > 1 && (
        <>
          <SegmentMeter
            className="mt-4"
            label={`Of ${formatPence(total)} a month, ${parts
              .map(
                (part) =>
                  `${formatPence(part.amount)} is ${part.label.toLowerCase()}`
              )
              .join(" and ")}.`}
            segments={parts.map((part) => ({
              pct: (part.amount / total) * 100,
              className: part.color,
              tip: `${part.label}, ${Math.round((part.amount / total) * 100)}%`,
            }))}
          />
          <div className="mt-2.5 space-y-1.5">
            {parts.map((part) => (
              <MeterLegendRow
                key={part.label}
                swatchClassName={part.color}
                label={part.label}
                amount={formatPence(part.amount)}
              />
            ))}
          </div>
        </>
      )}

      <ApexCardFootnote asRow>
        <MeterTotalRow label="Annually" amount={formatPence(annualTotal)} />
      </ApexCardFootnote>
    </ApexStatCard>
  )
}
