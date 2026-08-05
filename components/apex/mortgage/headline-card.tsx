import { ArrowRight, CalendarClock, House, TrendingUp } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { monthsBetween } from "@/lib/apex/mortgage/amortization"
import { formatPence } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { mortgageStatus, type MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

/**
 * Zone 1: what you pay now, and what it becomes when the deal ends.
 *
 * The one inverted panel on the page (dark card in the light theme, light in
 * the dark), so the answer that matters most carries its own hierarchy without
 * a section label. Lenders show the date a fixed rate ends; none shows the
 * payment it turns into, which is the number people act on.
 *
 * The meter is the deal itself: every tick a slice of the fixed period,
 * filled to today, the final six months amber because that is when a new
 * deal can usually be reserved.
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
    <Card
      size="sm"
      className={cn(
        "border-transparent bg-foreground text-background shadow-md",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-lg bg-background/10 text-primary [&>svg]:size-3.5"
          >
            <House />
          </span>
          {mortgage.name}
        </CardTitle>
        <CardDescription className="text-[13px] text-background/60">
          {rateSummary(mortgage, status)}
        </CardDescription>
        <CardAction className="flex items-center gap-2 [&_button]:text-background/70 [&_button:hover]:bg-background/10 [&_button:hover]:text-background">
          <Countdown status={status} />
          {action}
        </CardAction>
      </CardHeader>

      <CardContent className="pt-3">
        <PaymentPair mortgage={mortgage} status={status} />

        <DealMeter mortgage={mortgage} today={today} />

        {(status.shock !== null || guidance) && (
          <div className="mt-3.5 space-y-1">
            {status.shock !== null && status.shock !== 0 && (
              <p className="text-[13px] font-medium text-background/80">
                {shockSentence(status.shock, status.stage)}
              </p>
            )}
            {guidance && (
              <p className="text-[13px] text-background/60">{guidance}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * The paired answer: today's payment, the payment it becomes, and the delta
 * as a chip. Pence render faded (the reference grammar's grey half-figure)
 * so the pounds carry the comparison.
 */
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
        <span className="text-sm text-background/60">a month</span>
        {status.missing === "reversion_rate" && (
          <span className="text-sm text-background/45">
            {`after ${afterWord(mortgage, status)}, unknown`}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <PriceFigure pence={mortgage.monthlyPayment} />
      <ArrowRight aria-hidden className="size-5 shrink-0 text-background/40" />
      <PriceFigure pence={status.reversionPayment} />
      <span className="text-sm text-background/60">
        {`a month from ${afterWord(mortgage, status)}`}
      </span>
      {status.shock !== null && status.shock !== 0 && (
        <ShockChip shock={status.shock} stage={status.stage} />
      )}
    </div>
  )
}

/** £812.40 with the pence faded, so the pounds do the talking. */
function PriceFigure({ pence }: { pence: number }) {
  const text = formatPence(pence)
  const dot = text.lastIndexOf(".")
  return (
    <span className="font-heading text-3xl font-semibold tabular-nums">
      {text.slice(0, dot)}
      <span className="text-background/50">{text.slice(dot)}</span>
    </span>
  )
}

function ShockChip({
  shock,
  stage,
}: {
  shock: number
  stage: MortgageStatus["stage"]
}) {
  const more = shock > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
        // The panel flips with the theme, so on-panel tones flip too:
        // light theme = dark panel = light accent text, and vice versa.
        !more &&
          "bg-emerald-500/25 text-emerald-200 dark:bg-emerald-600/15 dark:text-emerald-700",
        more &&
          stage === "reverted" &&
          "bg-red-500/25 text-red-200 dark:bg-red-600/15 dark:text-red-700",
        more &&
          stage === "act" &&
          "bg-amber-500/25 text-amber-200 dark:bg-amber-500/20 dark:text-amber-700",
        more &&
          stage !== "act" &&
          stage !== "reverted" &&
          "bg-background/10 text-background/85"
      )}
    >
      <TrendingUp
        aria-hidden
        className={cn("size-3", !more && "rotate-180")}
      />
      {`${more ? "+" : "-"}${formatPence(Math.abs(shock))}`}
    </span>
  )
}

/** How many ticks the deal meter draws at most; each tick is a slice of the
 *  fixed period, so short deals stay chunky and long ones stay readable. */
const METER_MAX_TICKS = 48
/** Mirrors ARRANGE_WINDOW_MONTHS in status.ts: the reservable tail. */
const ARRANGE_TAIL_MONTHS = 6

/**
 * The fixed period as a segmented meter, filled to today. Needs both ends of
 * the deal to draw; without a start date there is no span to fill, so the
 * meter simply doesn't render and the countdown pill carries the time story.
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
  const ticks = Math.min(total, METER_MAX_TICKS)
  const filled = Math.round((elapsed / total) * ticks)
  // The reservable tail, in ticks; only the unfilled part of it reads amber
  const tailTicks = Math.ceil((ARRANGE_TAIL_MONTHS / total) * ticks)

  return (
    <div className="mt-4">
      <div aria-hidden className="flex h-5 items-stretch gap-[3px]">
        {Array.from({ length: ticks }, (_, index) => (
          <span
            key={index}
            className={cn(
              "flex-1 rounded-[2px]",
              index < filled
                ? "bg-background/90"
                : index >= ticks - tailTicks
                  ? "bg-amber-400/60 dark:bg-amber-500/60"
                  : "bg-background/15"
            )}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-background/50 tabular-nums">
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

  const months = status.monthsToRateEnd
  const ended = status.stage === "reverted"
  const label = ended
    ? "Ended"
    : months === 0
      ? "This month"
      : months === 1
        ? "1 month"
        : `${months} months`

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        ended && "bg-red-500/25 text-red-200 dark:bg-red-600/15 dark:text-red-700",
        !ended &&
          status.stage === "act" &&
          "bg-amber-500/25 text-amber-200 dark:bg-amber-500/20 dark:text-amber-700",
        !ended && status.stage !== "act" && "bg-background/10 text-background/85"
      )}
    >
      <CalendarClock aria-hidden className="size-3" />
      {label}
    </span>
  )
}

/** "April 2027": the month after the deal ends, or the reversion framing. */
function afterWord(mortgage: Mortgage, status: MortgageStatus): string {
  if (status.stage === "reverted") return "the deal's end"
  if (!mortgage.rateEndsOn) return "the standard rate starts"
  return monthAfter(mortgage.rateEndsOn)
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
