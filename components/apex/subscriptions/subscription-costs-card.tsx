import { Repeat } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { MeterHead } from "@/components/apex/meter"
import { DataProgress } from "@/components/apex/progress"
import {
  ApexStatCard,
  ApexStatFigure,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { formatPence } from "@/lib/apex/money"
import {
  annualPence,
  type RecurringPayment,
} from "@/lib/apex/subscriptions/queries"

/** Bars beyond this fold into one "Everything else" row. */
const TOP = 5

/**
 * The teaching card: each subscription priced by the year, because "£7.99 a
 * month" hides what "£95.88 a year" states. Independent quantities compared,
 * so one DataProgress each, all scaled to the largest (design skill, display
 * table). Monthly figures live on the Outgoings legend and the table; this
 * card never restates them.
 */
export function SubscriptionCostsCard({
  payments,
  className,
}: {
  payments: RecurringPayment[]
  className?: string
}) {
  const priced = payments
    .filter((payment) => payment.kind === "subscription")
    .map((payment) => ({
      id: payment.id,
      name: payment.name,
      annual: annualPence(payment.amount, payment.cadence),
    }))
    .sort((a, b) => b.annual - a.annual)

  // No subscriptions: the card steps aside and the row closes up. Never a
  // grey £0 (Rent card precedent).
  if (priced.length === 0) return null

  const total = priced.reduce((sum, entry) => sum + entry.annual, 0)
  const top = priced.slice(0, TOP)
  const rest = priced.slice(TOP)
  const restTotal = rest.reduce((sum, entry) => sum + entry.annual, 0)
  const scale = Math.max(top[0].annual, restTotal)

  return (
    <ApexStatCard
      label="Subscriptions"
      description="If each one keeps renewing at today's price"
      icon={Repeat}
      iconClassName={ANCHOR_TINTS.subscription}
      className={className}
    >
      <ApexStatValue>
        <ApexStatFigure>{formatPence(total)}</ApexStatFigure>{" "}
        <ApexStatUnit>a year</ApexStatUnit>
      </ApexStatValue>
      {/* A single subscription would draw one full-width bar — a 100%
          statement that says nothing — so the bars need company to exist. */}
      {priced.length > 1 && (
        <div className="mt-3.5 space-y-2.5">
          {top.map((entry) => (
            <div key={entry.id}>
              <MeterHead name={entry.name} amount={formatPence(entry.annual)} />
              <DataProgress
                value={(entry.annual / scale) * 100}
                color="var(--color-violet-500)"
              />
            </div>
          ))}
          {rest.length > 0 && (
            <div>
              <MeterHead
                name="Everything else"
                amount={formatPence(restTotal)}
              />
              <DataProgress
                value={(restTotal / scale) * 100}
                color="var(--color-slate-500)"
              />
            </div>
          )}
        </div>
      )}
    </ApexStatCard>
  )
}
