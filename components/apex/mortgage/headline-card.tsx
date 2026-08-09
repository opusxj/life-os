import { House } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { SegmentMeter } from "@/components/apex/meter"
import { ApexStatCard, ApexStatFigure } from "@/components/apex/stat-card"
import { MetaDot } from "@/components/shared/meta-dot"
import { parseDay } from "@/lib/apex/dates"
import { monthsBetween } from "@/lib/apex/mortgage/amortization"
import { formatPence } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { mortgageStatus, type MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatFullDate, formatMonthYear, pluralMonths } from "./format"

/**
 * Zone 1: what the end of the fixed rate is going to cost, said first.
 *
 * The headline is the consequence ("In 7 months your payment rises £227.20 a
 * month") because that is the fact worth acting on; the mechanism follows it
 * in one sentence. Earlier versions led with "your deal ends", which is
 * jargon that names neither what ends nor what happens next, and scattered
 * the consequence as orphaned fragments below.
 */
export function MortgageHeadlineCard({
  mortgage,
  today,
  action,
  className,
}: {
  mortgage: Mortgage
  /** yyyy-mm-dd resolved server-side so SSR and hydration agree */
  today: string
  /** The mortgage's own menu, so the card carries its whole identity */
  action?: React.ReactNode
  className?: string
}) {
  const status = mortgageStatus(mortgage, today)
  const guidance = guidanceFor(mortgage, status)
  const rising = status.shock !== null && status.shock > 0

  return (
    <ApexStatCard
      label={mortgage.name}
      description={
        <>
          {mortgage.lender}
          <MetaDot />
          {`${REPAYMENT_WORD[mortgage.repaymentType]} mortgage`}
        </>
      }
      icon={House}
      iconClassName={ANCHOR_TINTS.primary}
      action={action}
      className={className}
    >
      <p className="text-base font-medium">
        {headlineLead(mortgage, status)}
        {status.shock !== null && status.shock !== 0 && (
          <span
            className={cn(
              "tabular-nums",
              rising
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {` ${formatPence(Math.abs(status.shock))} a month`}
          </span>
        )}
      </p>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {mechanism(mortgage, status)}
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-x-7 gap-y-3">
        <PaymentColumn
          label={status.stage === "reverted" ? "Before" : "Paying now"}
          pence={mortgage.monthlyPayment}
        />
        {status.reversionPayment !== null ? (
          <PaymentColumn
            label={
              status.stage === "reverted"
                ? "Paying now"
                : `From ${monthAfter(mortgage.rateEndsOn)}`
            }
            pence={status.reversionPayment}
          />
        ) : (
          <div>
            <div className="text-[12px] text-muted-foreground">
              After it ends
            </div>
            <div className="mt-0.5 font-heading text-[25px] leading-8 font-semibold text-muted-foreground/50">
              ?
            </div>
          </div>
        )}
      </div>

      <DealMeter mortgage={mortgage} status={status} today={today} />

      {guidance && (
        <p className="mt-3.5 text-[13px] text-muted-foreground">{guidance}</p>
      )}
    </ApexStatCard>
  )
}

/**
 * The clause before the money. The amount itself is coloured by the caller,
 * so this returns only the words that lead into it.
 */
function headlineLead(mortgage: Mortgage, status: MortgageStatus): string {
  if (status.shock === null || status.shock === 0) {
    if (!mortgage.rateEndsOn || status.monthsToRateEnd === null) {
      return "Your rate has no end date"
    }
    if (status.stage === "reverted") return "Your fixed rate has ended"
    const months = status.monthsToRateEnd
    return months === 0
      ? "Your fixed rate ends this month"
      : `Your fixed rate ends in ${pluralMonths(months)}`
  }

  const direction = status.shock > 0 ? "rises" : "falls"
  if (status.stage === "reverted") {
    return `Your payment ${status.shock > 0 ? "rose" : "fell"}`
  }
  const months = status.monthsToRateEnd
  if (months === null) return `Your payment ${direction}`
  if (months === 0) return `This month your payment ${direction}`
  return `In ${pluralMonths(months)} your payment ${direction}`
}

/** Why the payment moves: the one sentence the card used to leave out. */
function mechanism(mortgage: Mortgage, status: MortgageStatus): string {
  const rate = `${mortgage.interestRate}% ${rateWord(mortgage.rateType)} rate`

  if (!mortgage.rateEndsOn) {
    return `You are on a ${rate} with no end date recorded.`
  }
  if (status.missing === "reversion_rate") {
    return `Your ${rate} ends ${formatFullDate(mortgage.rateEndsOn)}. Add ${mortgage.lender}'s standard rate to see what your payment becomes.`
  }
  const verb = status.stage === "reverted" ? "ended" : "ends"
  const moves = status.stage === "reverted" ? "moved" : "moves"
  return `Your ${rate} ${verb} ${formatFullDate(mortgage.rateEndsOn)} and ${mortgage.lender} ${moves} you to its ${mortgage.reversionRate}% standard rate.`
}

/** One labelled figure, pence faded so the pounds carry the comparison.
 *  25px, not ApexStatValue's 26: paired payment columns are their own rung
 *  on the density ladder, deliberately a step under the lone hero. */
function PaymentColumn({ label, pence }: { label: string; pence: number }) {
  return (
    <div>
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-heading text-[25px] leading-8 font-semibold tabular-nums">
        <ApexStatFigure>{formatPence(pence)}</ApexStatFigure>
      </div>
    </div>
  )
}

/** Mirrors ARRANGE_WINDOW_MONTHS in status.ts: the reservable tail. */
const ARRANGE_TAIL_MONTHS = 6

/**
 * The fixed period as the house SegmentMeter: one continuous run per region
 * (behind you, still to come, the reservable tail), fully rounded, spanning
 * the card. Tooltips are labels, not lectures.
 */
function DealMeter({
  mortgage,
  status,
  today,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  today: string
}) {
  if (!mortgage.rateStartedOn || !mortgage.rateEndsOn) return null

  const start = parseDay(mortgage.rateStartedOn)
  const end = parseDay(mortgage.rateEndsOn)
  const total = monthsBetween(start, end)
  if (total < 2) return null

  const elapsed = Math.min(
    total,
    Math.max(0, monthsBetween(start, parseDay(today)))
  )
  const remaining = total - elapsed
  const windowMonths = Math.min(remaining, ARRANGE_TAIL_MONTHS)
  const plainMonths = remaining - windowMonths
  const windowOpen = status.stage === "act" || status.stage === "reverted"

  return (
    <div className="mt-4">
      <SegmentMeter
        label={`${pluralMonths(elapsed)} of the ${pluralMonths(total)} fixed rate elapsed; ${pluralMonths(remaining)} remain.`}
        segments={[
          {
            pct: (elapsed / total) * 100,
            className: "bg-emerald-500",
            tip: `${pluralMonths(elapsed)} down`,
          },
          {
            pct: (plainMonths / total) * 100,
            className: "bg-muted",
            tip: `${pluralMonths(plainMonths)} to the reserve window`,
          },
          {
            pct: (windowMonths / total) * 100,
            className: "bg-amber-400/70 dark:bg-amber-500/60",
            tip: windowOpen
              ? "Reserve window, open now"
              : `Reserve window, opens ${status.arrangeFrom ? formatMonthYear(status.arrangeFrom) : "6 months out"}`,
          },
        ]}
      />
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{formatMonthYear(start)}</span>
        <span>{formatMonthYear(end)}</span>
      </div>
    </div>
  )
}

/** The one thing worth saying beyond the numbers, and only when there is one. */
function guidanceFor(
  mortgage: Mortgage,
  status: MortgageStatus
): string | null {
  if (status.stage === "reverted") {
    return "A product transfer with your existing lender is usually the quickest way onto a new rate."
  }
  if (status.stage === "act") {
    return "Most lenders let you reserve a new deal up to six months ahead, so you can arrange one now."
  }
  return null
}

function rateWord(rateType: Mortgage["rateType"]): string {
  return rateType === "fixed" ? "fixed" : rateType
}

const REPAYMENT_WORD: Record<Mortgage["repaymentType"], string> = {
  repayment: "repayment",
  interest_only: "interest only",
  part_and_part: "part and part",
}

/** The new payment starts the month after the rate ends. */
function monthAfter(dateKey: string | null): string {
  if (!dateKey) return "the standard rate"
  const date = parseDay(dateKey)
  return formatMonthYear(
    new Date(date.getFullYear(), date.getMonth() + 1, 1)
  )
}
