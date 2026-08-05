import { ArrowRight, CalendarClock, House, TrendingUp } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { ArcGauge } from "@/components/apex/arc-gauge"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { monthsBetween } from "@/lib/apex/mortgage/amortization"
import { formatPence } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { mortgageStatus, type MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

/**
 * TEMPORARY PICKER: four candidate designs for Zone 1, rendered one after the
 * other so the real data can judge them. Once one wins it replaces
 * MortgageHeadlineCard and this file goes away.
 */
export function HeadlineVariants({
  mortgage,
  today,
  action,
}: {
  mortgage: Mortgage
  /** yyyy-mm-dd resolved server-side so SSR and hydration agree */
  today: string
  action?: React.ReactNode
}) {
  const status = mortgageStatus(mortgage, today)
  const shared = { mortgage, status, today, action }

  return (
    <div className="space-y-5">
      <VariantSlot label="Option 1 · Ledger">
        <LedgerVariant {...shared} />
      </VariantSlot>
      <VariantSlot label="Option 2 · Meter">
        <MeterVariant {...shared} />
      </VariantSlot>
      <VariantSlot label="Option 3 · Wells">
        <WellsVariant {...shared} />
      </VariantSlot>
      <VariantSlot label="Option 4 · Clock">
        <ClockVariant {...shared} />
      </VariantSlot>
    </div>
  )
}

function VariantSlot({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}

type VariantProps = {
  mortgage: Mortgage
  status: MortgageStatus
  today: string
  action?: React.ReactNode
}

/* ------------------------------------------------------------------ */
/* Option 1 · Ledger: the classic shape plus the divided footer strip  */
/* ------------------------------------------------------------------ */

/**
 * The pre-restructure favourite, restored and polished: two labelled payment
 * columns with proportional bars, and the reference image's divided footer
 * strip carrying balance, rate end, and term end.
 */
function LedgerVariant({ mortgage, status, action }: VariantProps) {
  const guidance = guidanceFor(mortgage, status)

  return (
    <Card size="sm">
      <VariantHeader
        mortgage={mortgage}
        status={status}
        action={action}
        border
      />
      <CardContent className="pt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <PaymentColumn
            label="Paying now"
            amount={mortgage.monthlyPayment}
            caption={`${mortgage.interestRate}% ${rateWord(mortgage.rateType)}`}
            width={barWidth(mortgage.monthlyPayment, status.reversionPayment)}
            tone="current"
          />
          {status.reversionPayment !== null ? (
            <PaymentColumn
              label={`From ${afterWord(mortgage, status)}`}
              amount={status.reversionPayment}
              caption={`${mortgage.reversionRate}% standard rate`}
              width={barWidth(status.reversionPayment, mortgage.monthlyPayment)}
              tone={status.stage === "act" || status.stage === "reverted" ? "warn" : "neutral"}
            />
          ) : (
            <UnknownColumn lender={mortgage.lender} />
          )}
        </div>
        <ShockLines status={status} guidance={guidance} className="mt-4" />
      </CardContent>
      <CardFooter className="grid grid-cols-2 divide-x divide-border p-0 sm:grid-cols-3">
        <FooterStat label="Balance" value={formatPence(status.balanceToday)} />
        <FooterStat
          label={status.stage === "reverted" ? "Rate ended" : "Rate ends"}
          value={
            mortgage.rateEndsOn ? longDate(mortgage.rateEndsOn) : "No end date"
          }
        />
        <FooterStat
          label={status.lumpSumAtTerm ? "Capital due" : "Term ends"}
          value={monthYear(mortgage.termEndsOn)}
          className="col-span-2 border-t sm:col-span-1 sm:border-t-0"
        />
      </CardFooter>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Option 2 · Meter: the payment pair over the deal-progress meter     */
/* ------------------------------------------------------------------ */

/**
 * The latest content on a normal surface: one payment pair with faded pence
 * and a delta chip, then the fixed period as a tick meter filled to today,
 * the reservable final six months in amber.
 */
function MeterVariant({ mortgage, status, today, action }: VariantProps) {
  const guidance = guidanceFor(mortgage, status)

  return (
    <Card size="sm">
      <VariantHeader mortgage={mortgage} status={status} action={action} />
      <CardContent className="pt-1">
        <PaymentPair mortgage={mortgage} status={status} />
        <DealMeter mortgage={mortgage} today={today} />
        <ShockLines status={status} guidance={guidance} className="mt-3.5" />
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Option 3 · Wells: now and after as two tiles inside the card        */
/* ------------------------------------------------------------------ */

/**
 * The reference dashboards' sub-tile pattern: each payment lives in its own
 * muted well, the "after" well taking the stage's tint, the delta chip
 * sitting where the two meet.
 */
function WellsVariant({ mortgage, status, action }: VariantProps) {
  const guidance = guidanceFor(mortgage, status)
  const afterTone =
    status.stage === "reverted"
      ? "bg-destructive/10"
      : status.stage === "act"
        ? "bg-amber-500/10"
        : "bg-muted/50"

  return (
    <Card size="sm">
      <VariantHeader mortgage={mortgage} status={status} action={action} />
      <CardContent className="pt-1">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="text-[12px] text-muted-foreground">Paying now</div>
            <div className="mt-1">
              <PriceFigure pence={mortgage.monthlyPayment} size="lg" />
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground">
              {`${mortgage.interestRate}% ${rateWord(mortgage.rateType)}`}
            </div>
          </div>
          <div className={cn("relative rounded-lg p-3", afterTone)}>
            {status.reversionPayment !== null ? (
              <>
                <div className="text-[12px] text-muted-foreground">
                  {`From ${afterWord(mortgage, status)}`}
                </div>
                <div className="mt-1">
                  <PriceFigure pence={status.reversionPayment} size="lg" />
                </div>
                <div className="mt-1 text-[12px] text-muted-foreground">
                  {`${mortgage.reversionRate}% standard rate`}
                </div>
                {status.shock !== null && status.shock !== 0 && (
                  <ShockChip
                    shock={status.shock}
                    stage={status.stage}
                    className="absolute top-3 right-3"
                  />
                )}
              </>
            ) : (
              <>
                <div className="text-[12px] text-muted-foreground">
                  After your deal ends
                </div>
                <div className="mt-1 font-heading text-2xl font-semibold text-muted-foreground/50">
                  ?
                </div>
                <div className="mt-1 text-[12px] text-muted-foreground">
                  {`Needs ${mortgage.lender}'s standard rate`}
                </div>
              </>
            )}
          </div>
        </div>
        <ShockLines status={status} guidance={guidance} className="mt-3.5" />
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Option 4 · Clock: time leads, money supports                        */
/* ------------------------------------------------------------------ */

/**
 * The stage machine as the hero: how long is left on the deal, with the
 * deal's progress on an arc, and the payment pair as the supporting line.
 */
function ClockVariant({ mortgage, status, today, action }: VariantProps) {
  const guidance = guidanceFor(mortgage, status)
  const arc = dealProgress(mortgage, today)

  return (
    <Card size="sm">
      <VariantHeader mortgage={mortgage} status={status} action={action} />
      <CardContent className="pt-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="font-heading text-3xl font-semibold tabular-nums">
              {clockHeadline(status)}
            </div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              {clockSupport(mortgage, status)}
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[13px]">
              <span className="font-medium tabular-nums">
                {formatPence(mortgage.monthlyPayment)}
              </span>
              <span className="text-muted-foreground">now</span>
              {status.reversionPayment !== null ? (
                <>
                  <ArrowRight
                    aria-hidden
                    className="size-3.5 text-muted-foreground/60"
                  />
                  <span className="font-medium tabular-nums">
                    {formatPence(status.reversionPayment)}
                  </span>
                  <span className="text-muted-foreground">
                    {`from ${afterWord(mortgage, status)}`}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {`· after that, unknown`}
                </span>
              )}
            </div>
          </div>
          {arc && (
            <ArcGauge
              value={arc.pct}
              label={`${Math.round(arc.pct)}%`}
              caption="of the deal"
              arcClassName={
                status.stage === "act" || status.stage === "reverted"
                  ? "stroke-amber-500"
                  : "stroke-foreground/60"
              }
              className="mx-0 shrink-0"
            />
          )}
        </div>
        <ShockLines status={status} guidance={guidance} className="mt-3.5" />
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

function VariantHeader({
  mortgage,
  status,
  action,
  border,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  action?: React.ReactNode
  border?: boolean
}) {
  return (
    <CardHeader className={cn(border && "border-b")}>
      <CardTitle className="flex items-center gap-2 text-base">
        <span
          aria-hidden
          className={cn(
            "flex size-7 items-center justify-center rounded-lg [&>svg]:size-3.5",
            ANCHOR_TINTS.primary
          )}
        >
          <House />
        </span>
        {mortgage.name}
      </CardTitle>
      <CardDescription className="text-[13px]">
        {rateSummary(mortgage, status)}
      </CardDescription>
      <CardAction className="flex items-center gap-2">
        <Countdown status={status} />
        {action}
      </CardAction>
    </CardHeader>
  )
}

/** One labelled side of the Ledger comparison, bar scaled to the larger. */
function PaymentColumn({
  label,
  amount,
  caption,
  width,
  tone,
}: {
  label: string
  amount: number
  caption: string
  width: number
  tone: "current" | "neutral" | "warn"
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <PriceFigure pence={amount} size="lg" />
      <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "current" && "bg-foreground/25",
            tone === "neutral" && "bg-foreground/45",
            tone === "warn" && "bg-amber-500"
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="text-[12px] text-muted-foreground">{caption}</div>
    </div>
  )
}

/** The reversion rate is lender-set and can't be derived, so we ask for it. */
function UnknownColumn({ lender }: { lender: string }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[12px] text-muted-foreground">
        After your deal ends
      </div>
      <div className="flex items-center gap-1.5 font-heading text-2xl font-semibold text-muted-foreground/50">
        <span aria-hidden>?</span>
        <ArrowRight className="size-4" />
      </div>
      <div className="h-1.5 rounded-full bg-muted" aria-hidden />
      <div className="text-[12px] text-muted-foreground">
        {`Needs ${lender}'s standard rate`}
      </div>
    </div>
  )
}

/** The paired answer with faded pence and the stage-toned delta chip. */
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
        <PriceFigure pence={mortgage.monthlyPayment} size="xl" />
        <span className="text-sm text-muted-foreground">a month</span>
        <span className="text-sm text-muted-foreground/70">
          {`· after ${afterWord(mortgage, status)}, unknown`}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <PriceFigure pence={mortgage.monthlyPayment} size="xl" />
      <ArrowRight
        aria-hidden
        className="size-5 shrink-0 text-muted-foreground/50"
      />
      <PriceFigure pence={status.reversionPayment} size="xl" />
      <span className="text-sm text-muted-foreground">
        {`a month from ${afterWord(mortgage, status)}`}
      </span>
      {status.shock !== null && status.shock !== 0 && (
        <ShockChip shock={status.shock} stage={status.stage} />
      )}
    </div>
  )
}

/** £812.40 with the pence faded, so the pounds carry the comparison. */
function PriceFigure({
  pence,
  size = "lg",
}: {
  pence: number
  size?: "lg" | "xl"
}) {
  const text = formatPence(pence)
  const dot = text.lastIndexOf(".")
  return (
    <span
      className={cn(
        "font-heading font-semibold tabular-nums",
        size === "xl" ? "text-3xl" : "text-2xl"
      )}
    >
      {text.slice(0, dot)}
      <span className="text-muted-foreground/60">{text.slice(dot)}</span>
    </span>
  )
}

function ShockChip({
  shock,
  stage,
  className,
}: {
  shock: number
  stage: MortgageStatus["stage"]
  className?: string
}) {
  const more = shock > 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
        !more &&
          "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
        more &&
          stage === "reverted" &&
          "bg-destructive/10 text-destructive dark:bg-destructive/20",
        more &&
          stage === "act" &&
          "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
        more &&
          stage !== "act" &&
          stage !== "reverted" &&
          "bg-muted text-foreground/80",
        className
      )}
    >
      <TrendingUp aria-hidden className={cn("size-3", !more && "rotate-180")} />
      {`${more ? "+" : "-"}${formatPence(Math.abs(shock))}`}
    </span>
  )
}

const METER_MAX_TICKS = 48
const ARRANGE_TAIL_MONTHS = 6

/** The fixed period as tick segments filled to today, on the card surface. */
function DealMeter({
  mortgage,
  today,
}: {
  mortgage: Mortgage
  today: string
}) {
  const progress = dealProgress(mortgage, today)
  if (!progress) return null
  const { total, elapsed, start, end } = progress

  const ticks = Math.min(total, METER_MAX_TICKS)
  const filled = Math.round((elapsed / total) * ticks)
  const tailTicks = Math.ceil((ARRANGE_TAIL_MONTHS / total) * ticks)

  return (
    <div className="mt-4">
      <div aria-hidden className="flex h-4 items-stretch gap-[3px]">
        {Array.from({ length: ticks }, (_, index) => (
          <span
            key={index}
            className={cn(
              "flex-1 rounded-[2px]",
              index < filled
                ? "bg-foreground/70"
                : index >= ticks - tailTicks
                  ? "bg-amber-400/70 dark:bg-amber-500/60"
                  : "bg-muted"
            )}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{MONTH_YEAR.format(start)}</span>
        <span>{MONTH_YEAR.format(end)}</span>
      </div>
    </div>
  )
}

/** How far through the fixed period today sits; null without both deal dates. */
function dealProgress(
  mortgage: Mortgage,
  today: string
): { total: number; elapsed: number; pct: number; start: Date; end: Date } | null {
  if (!mortgage.rateStartedOn || !mortgage.rateEndsOn) return null
  const start = parseDay(mortgage.rateStartedOn)
  const end = parseDay(mortgage.rateEndsOn)
  const total = monthsBetween(start, end)
  if (total < 2) return null
  const elapsed = Math.min(
    total,
    Math.max(0, monthsBetween(start, parseDay(today)))
  )
  return { total, elapsed, pct: (elapsed / total) * 100, start, end }
}

/** The shock and guidance lines every variant closes on. */
function ShockLines({
  status,
  guidance,
  className,
}: {
  status: MortgageStatus
  guidance: string | null
  className?: string
}) {
  if ((status.shock === null || status.shock === 0) && !guidance) return null
  return (
    <div className={cn("space-y-1", className)}>
      {status.shock !== null && status.shock !== 0 && (
        <p
          className={cn(
            "text-[13px] font-medium",
            status.stage === "act" && "text-amber-600 dark:text-amber-400",
            status.stage === "reverted" && "text-destructive",
            status.stage !== "act" &&
              status.stage !== "reverted" &&
              "text-foreground/80"
          )}
        >
          {shockSentence(status.shock, status.stage)}
        </p>
      )}
      {guidance && (
        <p className="text-[13px] text-muted-foreground">{guidance}</p>
      )}
    </div>
  )
}

function FooterStat({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn("px-4 py-2.5", className)}>
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="text-[15px] font-medium tabular-nums">{value}</div>
    </div>
  )
}

function Countdown({ status }: { status: MortgageStatus }) {
  if (status.monthsToRateEnd === null) return null

  if (status.stage === "reverted") {
    return <Badge variant="destructive">Ended</Badge>
  }

  const months = status.monthsToRateEnd
  const label =
    months === 0 ? "This month" : months === 1 ? "1 month" : `${months} months`

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5",
        status.stage === "act" &&
          "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
      )}
    >
      <CalendarClock className="size-3" />
      {label}
    </Badge>
  )
}

function clockHeadline(status: MortgageStatus): string {
  if (status.monthsToRateEnd === null) return "No end date"
  if (status.stage === "reverted") return "Deal ended"
  const months = status.monthsToRateEnd
  if (months === 0) return "Ends this month"
  return months === 1 ? "1 month left" : `${months} months left`
}

function clockSupport(mortgage: Mortgage, status: MortgageStatus): string {
  const rate = `${mortgage.interestRate}% ${rateWord(mortgage.rateType)}`
  if (status.stage === "reverted" && mortgage.rateEndsOn) {
    return `Your ${rate} deal ended ${longDate(mortgage.rateEndsOn)}`
  }
  if (!mortgage.rateEndsOn) return `On a ${rate} rate with no end date`
  return `On your ${rate} deal until ${longDate(mortgage.rateEndsOn)}`
}

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

function afterWord(mortgage: Mortgage, status: MortgageStatus): string {
  if (status.stage === "reverted") return "the deal's end"
  if (!mortgage.rateEndsOn) return "the standard rate starts"
  return monthAfter(mortgage.rateEndsOn)
}

function barWidth(value: number, against: number | null): number {
  const largest = Math.max(value, against ?? value)
  if (largest <= 0) return 0
  return Math.round((value / largest) * 100)
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

function monthYear(dateKey: string): string {
  return FULL_MONTH_YEAR.format(parseDay(dateKey))
}

/** yyyy-mm-dd → local midnight, matching status.ts month arithmetic */
function parseDay(key: string): Date {
  return new Date(`${key}T00:00:00`)
}
