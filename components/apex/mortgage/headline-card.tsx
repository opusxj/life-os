import { ArrowRight, CalendarClock, House, TrendingUp } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { ApexStatCard, ApexStatTag } from "@/components/apex/stat-card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { monthsBetween } from "@/lib/apex/mortgage/amortization"
import { formatPence } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { mortgageStatus, type MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { pluralMonths } from "./format"

/**
 * Zone 1: what you pay now, and what it becomes when the deal ends.
 *
 * Lenders show the date a fixed rate ends; none shows the payment it turns
 * into, which is the number people act on. The payment pair carries the
 * money, the deal meter carries the time: the whole fixed period as ticks,
 * filled to today, the reservable tail in amber — and every region says
 * what it is on hover, because unexplained colored squares are decoration.
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

  return (
    <ApexStatCard
      label={mortgage.name}
      description={rateSummary(mortgage, status)}
      icon={House}
      iconClassName={ANCHOR_TINTS.primary}
      action={
        <span className="flex items-center gap-2">
          <Countdown status={status} />
          {action}
        </span>
      }
      className={className}
    >
      <PaymentPair mortgage={mortgage} status={status} />

      <DealMeter mortgage={mortgage} today={today} />

      {(status.shock !== null || guidance) && (
        <div className="mt-3.5 space-y-1">
          {status.shock !== null && status.shock !== 0 && (
            <p className="text-[13px] font-medium text-foreground/80">
              {shockSentence(status.shock, status.stage)}
            </p>
          )}
          {guidance && (
            <p className="text-[13px] text-muted-foreground">{guidance}</p>
          )}
        </div>
      )}
    </ApexStatCard>
  )
}

/** The paired answer: today's payment, the payment it becomes, the delta pill. */
function PaymentPair({
  mortgage,
  status,
}: {
  mortgage: Mortgage
  status: MortgageStatus
}) {
  if (status.reversionPayment === null) {
    return (
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <PriceFigure pence={mortgage.monthlyPayment} />
        <span className="text-[13px] text-muted-foreground">a month</span>
        {status.missing === "reversion_rate" && (
          <span className="text-[13px] text-muted-foreground/70">
            {`after ${afterWord(mortgage, status)}, unknown`}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      <PriceFigure pence={mortgage.monthlyPayment} />
      <ArrowRight
        aria-hidden
        className="size-4.5 shrink-0 text-muted-foreground/50"
      />
      <PriceFigure pence={status.reversionPayment} />
      <span className="text-[13px] text-muted-foreground">
        {`a month from ${afterWord(mortgage, status)}`}
      </span>
      {status.shock !== null && status.shock !== 0 && (
        <ApexStatTag tint={shockTint(status)}>
          <TrendingUp
            aria-hidden
            className={cn("size-3", status.shock < 0 && "rotate-180")}
          />
          {`${status.shock > 0 ? "+" : "-"}${formatPence(Math.abs(status.shock))} a month`}
        </ApexStatTag>
      )}
    </div>
  )
}

/** £812.40 with the pence faded, so the pounds carry the comparison. */
function PriceFigure({ pence }: { pence: number }) {
  const text = formatPence(pence)
  const dot = text.lastIndexOf(".")
  return (
    <span className="font-heading text-[25px] leading-8 font-semibold tabular-nums">
      {text.slice(0, dot)}
      <span className="text-muted-foreground/60">{text.slice(dot)}</span>
    </span>
  )
}

function shockTint(status: MortgageStatus) {
  if (status.shock !== null && status.shock < 0) return "balance" as const
  if (status.stage === "reverted") return "destructive" as const
  if (status.stage === "act") return "due" as const
  return "neutral" as const
}

/** How many ticks the deal meter draws at most; each tick is a slice of the
 *  fixed period, so short deals stay chunky and long ones stay readable. */
const METER_MAX_TICKS = 48
/** Mirrors ARRANGE_WINDOW_MONTHS in status.ts: the reservable tail. */
const ARRANGE_TAIL_MONTHS = 6

type TickKind = "done" | "left" | "window"

/**
 * The fixed period as a segmented meter, filled to today. Contiguous runs of
 * ticks share one tooltip, so hovering any part of a region says what the
 * region IS: months behind you, months until the reserve window, the window
 * itself. Needs both ends of the deal to draw; without a start date the
 * countdown pill carries the time story alone.
 */
function DealMeter({
  mortgage,
  today,
}: {
  mortgage: Mortgage
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

  const ticks = Math.min(total, METER_MAX_TICKS)
  const filled = Math.round((elapsed / total) * ticks)
  const windowTicks = Math.min(
    ticks - filled,
    Math.ceil((ARRANGE_TAIL_MONTHS / total) * ticks)
  )
  const plainTicks = ticks - filled - windowTicks

  const regions: { kind: TickKind; count: number; tip: string }[] = [
    {
      kind: "done" as const,
      count: filled,
      tip: `${pluralMonths(elapsed)} of this ${pluralMonths(total)} deal are behind you.`,
    },
    {
      kind: "left" as const,
      count: plainTicks,
      tip: `${pluralMonths(plainMonths)} until the reserve window opens.`,
    },
    {
      kind: "window" as const,
      count: windowTicks,
      tip: `The last ${pluralMonths(windowMonths)} of the deal. Most lenders let you reserve a new deal this far ahead.`,
    },
  ].filter((region) => region.count > 0)

  return (
    <div className="mt-4">
      <div
        role="img"
        aria-label={`${pluralMonths(elapsed)} of the ${pluralMonths(total)} deal elapsed; ${pluralMonths(remaining)} remain.`}
        className="flex h-4 items-stretch gap-[3px]"
      >
        {regions.map((region) => (
          <Tooltip key={region.kind}>
            <TooltipTrigger
              render={
                <span
                  className="flex cursor-help items-stretch gap-[3px]"
                  style={{ flexGrow: region.count, flexBasis: 0 }}
                />
              }
            >
              {Array.from({ length: region.count }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "flex-1 rounded-[3px]",
                    region.kind === "done" && "bg-emerald-500",
                    region.kind === "left" && "bg-muted",
                    region.kind === "window" &&
                      "bg-amber-400/70 dark:bg-amber-500/60"
                  )}
                />
              ))}
            </TooltipTrigger>
            <TooltipContent>{region.tip}</TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{MONTH_YEAR.format(start)}</span>
        <span>{MONTH_YEAR.format(end)}</span>
      </div>
    </div>
  )
}

/** The facts, under the name: who it's with, what rate, and until when. */
function rateSummary(mortgage: Mortgage, status: MortgageStatus): string {
  const rate = `${mortgage.interestRate}% ${rateWord(mortgage.rateType)}`
  if (status.stage === "reverted" && mortgage.rateEndsOn) {
    return `${mortgage.lender} · ${rate} ended ${longDate(mortgage.rateEndsOn)}`
  }
  if (!mortgage.rateEndsOn) {
    return `${mortgage.lender} · ${rate}, no end date`
  }
  return `${mortgage.lender} · ${rate} until ${longDate(mortgage.rateEndsOn)}`
}

/** The one thing worth saying beyond the numbers, and only when there is one. */
function guidanceFor(
  mortgage: Mortgage,
  status: MortgageStatus
): string | null {
  if (status.missing === "reversion_rate") {
    return `Add ${mortgage.lender}'s standard rate to see what your payment becomes when this deal ends.`
  }
  if (status.stage === "reverted") {
    return "A product transfer with your existing lender is usually the quickest way onto a new rate."
  }
  if (status.stage === "act") {
    return "Most lenders let you reserve a new deal up to six months ahead, so you can arrange one now."
  }
  return null
}

function Countdown({ status }: { status: MortgageStatus }) {
  if (status.monthsToRateEnd === null) return null

  const ended = status.stage === "reverted"
  const months = status.monthsToRateEnd
  const label = ended
    ? "Ended"
    : months === 0
      ? "This month"
      : pluralMonths(months)

  return (
    <ApexStatTag
      tint={ended ? "destructive" : status.stage === "act" ? "due" : "neutral"}
    >
      <CalendarClock aria-hidden className="size-3" />
      {label}
    </ApexStatTag>
  )
}

function shockSentence(
  shock: number,
  stage: MortgageStatus["stage"]
): string {
  const yearly = formatPence(Math.abs(shock) * 12)
  if (stage === "reverted") {
    return shock > 0
      ? `That is ${yearly} a year more than the deal you were on.`
      : `That is ${yearly} a year less than the deal you were on.`
  }
  return shock > 0
    ? `${yearly} a year more once the deal ends.`
    : `${yearly} a year less once the deal ends.`
}

/** "April 2027": the month after the deal ends, or the reversion framing. */
function afterWord(mortgage: Mortgage, status: MortgageStatus): string {
  if (status.stage === "reverted") return "the deal's end"
  if (!mortgage.rateEndsOn) return "the standard rate starts"
  return monthAfter(mortgage.rateEndsOn)
}

function rateWord(rateType: Mortgage["rateType"]): string {
  return rateType === "fixed" ? "fixed" : rateType
}

const MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
})
const FULL_MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
})
const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

/** The new payment starts the month after the deal ends. */
function monthAfter(dateKey: string): string {
  const date = parseDay(dateKey)
  return FULL_MONTH_YEAR.format(
    new Date(date.getFullYear(), date.getMonth() + 1, 1)
  )
}

function longDate(dateKey: string): string {
  return LONG_DATE.format(parseDay(dateKey))
}

/** yyyy-mm-dd → local midnight, matching status.ts month arithmetic */
function parseDay(key: string): Date {
  return new Date(`${key}T00:00:00`)
}
