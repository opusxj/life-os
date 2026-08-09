import { Coins } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { MeterSwatch, SegmentMeter } from "@/components/apex/meter"
import {
  ApexStatCard,
  ApexStatFigure,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"

/**
 * Colours carry the vocabulary the page already speaks: sky for the committed
 * cost that is the card's subject, indigo for rent because it is charged on
 * the landlord's share of the property, and slate for lease charges. Slate
 * rather than bg-muted because muted sits darker than the card in dark mode
 * and lighter in light, so a muted segment would flip polarity between themes.
 * Slate at the same 500 grade as its neighbours: 400 read as white on the
 * light card, and a neutral only works here if it is unmistakably drawn.
 */
const PAYMENT_COLOR = "bg-sky-500"
const RENT_COLOR = "bg-indigo-500"
const EXTRA_COLOR = "bg-slate-500"

type CostPart = {
  label: string
  /** Pence a month */
  amount: number
  /** Tailwind bg class shared by the part's segment and its legend swatch */
  color: string
}

/** What does this cost every month, all in? */
export function MonthlyCostCard({ mortgage }: { mortgage: Mortgage }) {
  // A recorded £0 would put a swatched row under a meter with no segment to
  // point at, so zero-amount parts are left out of the card entirely.
  const parts: CostPart[] = [
    {
      label: "Mortgage payment",
      amount: mortgage.monthlyPayment,
      color: PAYMENT_COLOR,
    },
  ]
  if (mortgage.rentMonthly !== null && mortgage.rentMonthly > 0) {
    parts.push({ label: "Rent", amount: mortgage.rentMonthly, color: RENT_COLOR })
  }
  for (const extra of mortgage.extras) {
    if (extra.monthly > 0) {
      parts.push({ label: extra.label, amount: extra.monthly, color: EXTRA_COLOR })
    }
  }
  const total = parts.reduce((sum, part) => sum + part.amount, 0)

  return (
    <ApexStatCard
      label="Monthly cost"
      description="Every monthly cost you recorded"
      icon={Coins}
      iconClassName={ANCHOR_TINTS.bill}
    >
      <ApexStatValue>
        <ApexStatFigure>{formatPenceShort(total)}</ApexStatFigure>
      </ApexStatValue>

      {/* One cost is not a composition: a single-segment meter is a filled bar
          announcing 100%, so the payment-only card stays hero-only. */}
      {parts.length > 1 && (
        <>
          <SegmentMeter
            className="mt-4"
            label={`Of ${formatPence(total)} a month, ${parts
              .map((part) => `${formatPence(part.amount)} is ${part.label.toLowerCase()}`)
              .join(", ")}.`}
            segments={parts.map((part) => ({
              pct: (part.amount / total) * 100,
              className: part.color,
              tip: `${part.label}, ${Math.round((part.amount / total) * 100)}%`,
            }))}
          />
          <div className="mt-2.5 space-y-1.5">
            {parts.map((part) => (
              <div
                key={part.label}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
                  <MeterSwatch className={part.color} />
                  <span className="truncate">{part.label}</span>
                </span>
                <span className="shrink-0 text-[13px] font-medium tabular-nums">
                  {formatPence(part.amount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* The same costs at the longer range, in the legend's own grammar. The
          square is an outline because this row is all of the above rather
          than one slice. Pinned to the base so the card carries no dead air
          beside a taller neighbour. */}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <MeterSwatch className="border-[1.5px] border-muted-foreground/50" />
            Annually
          </span>
          <span className="shrink-0 text-[13px] font-medium tabular-nums">
            {formatPence(total * 12)}
          </span>
        </div>
      </div>
    </ApexStatCard>
  )
}
