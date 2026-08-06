import { House } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { ApexStatCard } from "@/components/apex/stat-card"
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
 * Zone 1: the deal ending, stated as a sentence, with every number attached
 * to it in words.
 *
 * The card's one event is the fixed rate dying. Earlier versions scattered
 * its consequences as fragments ("From April 2027", "+£227.20", a "7 months"
 * badge) and the user rightly asked: from what? more than what? seven months
 * to WHAT? The design skill's no-orphaned-data rule was written off the back
 * of this card: state the event, then hang the numbers off it.
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
      description={`${mortgage.lender} · ${mortgage.interestRate}% ${rateWord(mortgage.rateType)} · ${REPAYMENT_WORD[mortgage.repaymentType]}`}
      icon={House}
      iconClassName={ANCHOR_TINTS.primary}
      action={action}
      className={className}
    >
      <p className="text-base font-medium">
        {eventSentence(mortgage, status)}
        {mortgage.rateEndsOn && (
          <span className="font-normal text-muted-foreground">
            {` · ${longDate(mortgage.rateEndsOn)}`}
          </span>
        )}
      </p>

      <div className="mt-3.5 flex flex-wrap items-start gap-x-7 gap-y-3">
        <PaymentColumn
          label={status.stage === "reverted" ? "Before" : "Paying now"}
          pence={mortgage.monthlyPayment}
        />
        {status.reversionPayment !== null ? (
          <PaymentColumn
            label={
              status.stage === "reverted" ? "Paying now" : "After the deal ends"
            }
            pence={status.reversionPayment}
            delta={status.shock}
          />
        ) : (
          <div>
            <div className="text-[12px] text-muted-foreground">
              After the deal ends
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
 * One labelled figure. The delta renders UNDER the value it belongs to, in
 * the money colors (red = costs more, emerald = costs less), with the yearly
 * figure one hover away.
 */
function PaymentColumn({
  label,
  pence,
  delta,
}: {
  label: string
  pence: number
  /** Signed monthly difference vs the other column; omit for the base column */
  delta?: number | null
}) {
  return (
    <div>
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="mt-0.5">
        <PriceFigure pence={pence} />
      </div>
      {delta !== undefined && delta !== null && delta !== 0 && (
        <Tooltip>
          <TooltipTrigger
            render={
              <p
                className={cn(
                  "mt-0.5 cursor-help text-[13px] font-medium tabular-nums",
                  delta > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              />
            }
          >
            {`${delta > 0 ? "+" : "-"}${formatPence(Math.abs(delta))} a month`}
          </TooltipTrigger>
          <TooltipContent>
            {`${formatPence(Math.abs(delta) * 12)} a year`}
          </TooltipContent>
        </Tooltip>
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

/** The event, in words. Everything else on the card hangs off this line. */
function eventSentence(mortgage: Mortgage, status: MortgageStatus): string {
  if (!mortgage.rateEndsOn || status.monthsToRateEnd === null) {
    return "Your rate has no end date"
  }
  if (status.stage === "reverted") return "Your deal ended"
  const months = status.monthsToRateEnd
  if (months === 0) return "Your deal ends this month"
  return `Your deal ends in ${pluralMonths(months)}`
}

/** How many ticks the deal meter draws at most. */
const METER_MAX_TICKS = 48
/** Mirrors ARRANGE_WINDOW_MONTHS in status.ts: the reservable tail. */
const ARRANGE_TAIL_MONTHS = 6

type TickKind = "done" | "left" | "window"

/**
 * The fixed period as a segmented meter, filled to today, capped in width so
 * it never sprawls. Tooltips are labels, not lectures: what each region is,
 * in a few words.
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

  const ticks = Math.min(total, METER_MAX_TICKS)
  const filled = Math.round((elapsed / total) * ticks)
  const windowTicks = Math.min(
    ticks - filled,
    Math.ceil((ARRANGE_TAIL_MONTHS / total) * ticks)
  )
  const plainTicks = ticks - filled - windowTicks

  const windowOpen = status.stage === "act" || status.stage === "reverted"
  const regions: { kind: TickKind; count: number; tip: string }[] = [
    {
      kind: "done" as const,
      count: filled,
      tip: `${pluralMonths(elapsed)} down`,
    },
    {
      kind: "left" as const,
      count: plainTicks,
      tip: `${pluralMonths(plainMonths)} to the reserve window`,
    },
    {
      kind: "window" as const,
      count: windowTicks,
      tip: windowOpen
        ? "Reserve window, open now"
        : `Reserve window, opens ${status.arrangeFrom ? MONTH_YEAR.format(status.arrangeFrom) : "6 months out"}`,
    },
  ].filter((region) => region.count > 0)

  return (
    <div className="mt-4 max-w-md">
      <div
        role="img"
        aria-label={`${pluralMonths(elapsed)} of the ${pluralMonths(total)} deal elapsed; ${pluralMonths(remaining)} remain.`}
        className="flex h-3.5 items-stretch gap-[3px]"
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

function rateWord(rateType: Mortgage["rateType"]): string {
  return rateType === "fixed" ? "fixed" : rateType
}

const REPAYMENT_WORD: Record<Mortgage["repaymentType"], string> = {
  repayment: "repayment",
  interest_only: "interest only",
  part_and_part: "part and part",
}

const MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
})
const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

function longDate(dateKey: string): string {
  return LONG_DATE.format(parseDay(dateKey))
}

/** yyyy-mm-dd → local midnight, matching status.ts month arithmetic */
function parseDay(key: string): Date {
  return new Date(`${key}T00:00:00`)
}
