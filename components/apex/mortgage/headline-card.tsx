import Link from "next/link"
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import { monthsFromNow } from "@/lib/apex/mortgage/amortization"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { mortgageStatus, type MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

/**
 * Zone 1 — the page's single answer, and it changes with where you are in the
 * deal cycle. Quiet for years; for a few months every two to five years the
 * reversion payment is the only thing that matters and it takes the page over.
 *
 * The stages come from research (docs/modules/apex/mortgage.md §3.1): anxiety
 * here is caused by not knowing, not by the number, so `watch` states plainly
 * that there is nothing to do yet rather than showing a red countdown against
 * an action that isn't available.
 */
export function MortgageHeadlineCard({
  mortgage,
  today,
  className,
}: {
  mortgage: Mortgage
  /** yyyy-mm-dd resolved server-side so SSR and hydration agree */
  today: string
  className?: string
}) {
  const status = mortgageStatus(mortgage, today)

  return (
    <Card
      size="sm"
      className={cn(
        "gap-0 border-l-4 p-0",
        ACCENT[status.stage].border,
        className
      )}
    >
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <Headline mortgage={mortgage} status={status} />
        <Aside mortgage={mortgage} status={status} />
      </CardContent>
    </Card>
  )
}

const ACCENT = {
  settled: {
    border: "border-l-emerald-500/70",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  watch: { border: "border-l-border", text: "text-foreground" },
  act: {
    border: "border-l-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  reverted: { border: "border-l-destructive", text: "text-destructive" },
} as const

function Headline({
  mortgage,
  status,
}: {
  mortgage: Mortgage
  status: MortgageStatus
}) {
  // Reversion is the whole point of the card, and the rate can't be guessed —
  // SVR is lender-set, not base + N. Ask for it rather than invent it.
  if (
    (status.stage === "act" || status.stage === "reverted") &&
    status.missing === "reversion_rate"
  ) {
    return (
      <Block
        eyebrow={
          status.stage === "reverted"
            ? "Your deal has ended"
            : `Your deal ends ${relativeMonths(status.monthsToRateEnd)}`
        }
        eyebrowIcon={CircleAlert}
        eyebrowClass={ACCENT[status.stage].text}
        value="What happens to your payment?"
        valueClass="text-xl sm:text-2xl"
        note={`Add ${mortgage.lender}'s standard rate and we'll show you the new payment before it lands.`}
      />
    )
  }

  switch (status.stage) {
    case "reverted":
      return (
        <Block
          eyebrow="You're on the standard rate"
          eyebrowIcon={CircleAlert}
          eyebrowClass={ACCENT.reverted.text}
          value={
            status.shock !== null && status.shock > 0
              ? `${formatPenceShort(status.shock)} a month more than you were`
              : "Your fixed deal has ended"
          }
          valueClass="text-2xl sm:text-3xl"
          note="A product transfer with your existing lender is usually the quickest way off it."
        />
      )

    case "act":
      return (
        <Block
          eyebrow={`Your deal ends ${relativeMonths(status.monthsToRateEnd)}`}
          eyebrowIcon={CalendarClock}
          eyebrowClass={ACCENT.act.text}
          value={
            status.shock !== null
              ? `${status.shock > 0 ? "+" : ""}${formatPenceShort(status.shock)} a month`
              : "Time to arrange your next deal"
          }
          valueClass="text-3xl sm:text-4xl"
          note={
            status.shock !== null && status.reversionPayment !== null
              ? `${formatPence(mortgage.monthlyPayment)} now → ${formatPence(status.reversionPayment)} if you do nothing. You can arrange a new deal today.`
              : "You can arrange a new deal today."
          }
        />
      )

    case "watch":
      return (
        <Block
          eyebrow={`Your deal ends ${relativeMonths(status.monthsToRateEnd)}`}
          eyebrowIcon={CalendarClock}
          eyebrowClass="text-muted-foreground"
          value="Nothing to do yet"
          valueClass="text-2xl sm:text-3xl"
          note={
            status.arrangeFrom
              ? `You can start arranging a new deal from ${longDate(status.arrangeFrom)} — we'll tell you then.`
              : undefined
          }
        />
      )

    default:
      return <SettledBlock mortgage={mortgage} status={status} />
  }
}

/** The quiet state, which is most of the time. Time leads; money supports. */
function SettledBlock({
  mortgage,
  status,
}: {
  mortgage: Mortgage
  status: MortgageStatus
}) {
  if (status.lumpSumAtTerm) {
    return (
      <Block
        eyebrow="Interest only"
        eyebrowIcon={TrendingUp}
        eyebrowClass="text-muted-foreground"
        value={`${formatPenceShort(status.balanceToday)} due ${monthYear(new Date(`${mortgage.termEndsOn}T00:00:00`))}`}
        valueClass="text-2xl sm:text-3xl"
        note="The balance doesn't reduce on this kind of mortgage — the capital is repaid as a lump sum at the end of the term."
      />
    )
  }

  if (status.monthsToFree === null) {
    return (
      <Block
        eyebrow="Mortgage"
        eyebrowIcon={TrendingUp}
        eyebrowClass="text-muted-foreground"
        value={formatPenceShort(status.balanceToday)}
        valueClass="text-3xl sm:text-4xl"
        note="The payment doesn't currently cover the interest, so the balance isn't reducing."
      />
    )
  }

  return (
    <Block
      eyebrow="Mortgage-free in"
      eyebrowIcon={TrendingUp}
      eyebrowClass="text-muted-foreground"
      value={durationWords(status.monthsToFree)}
      valueClass="text-3xl sm:text-4xl"
      note={`${formatPenceShort(status.balanceToday)} left, on track for ${monthYear(monthsFromNow(status.monthsToFree))}.`}
    />
  )
}

/** Right-hand column: the one action, when there is one. */
function Aside({
  mortgage,
  status,
}: {
  mortgage: Mortgage
  status: MortgageStatus
}) {
  if (status.missing === "reversion_rate") {
    return (
      <Button size="sm" variant="outline" render={<Link href="#rate" />}>
        Add standard rate
        <ArrowRight data-icon="inline-end" />
      </Button>
    )
  }

  if (status.stage === "act" || status.stage === "reverted") {
    return (
      <div className="shrink-0 text-right">
        <div className="text-[12px] text-muted-foreground">Paying now</div>
        <div className="text-lg font-medium tabular-nums">
          {formatPence(mortgage.monthlyPayment)}
        </div>
        {status.reversionPayment !== null && (
          <>
            <div className="mt-1.5 text-[12px] text-muted-foreground">
              After {shortDate(mortgage.rateEndsOn)}
            </div>
            <div
              className={cn(
                "text-lg font-medium tabular-nums",
                ACCENT[status.stage].text
              )}
            >
              {formatPence(status.reversionPayment)}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="shrink-0 text-right">
      <div className="text-[12px] text-muted-foreground">Monthly payment</div>
      <div className="text-lg font-medium tabular-nums">
        {formatPence(mortgage.monthlyPayment)}
      </div>
      <div className="mt-1.5 text-[12px] text-muted-foreground">
        {mortgage.interestRate}% {rateWord(mortgage.rateType)}
      </div>
    </div>
  )
}

function Block({
  eyebrow,
  eyebrowIcon: Icon,
  eyebrowClass,
  value,
  valueClass,
  note,
}: {
  eyebrow: string
  eyebrowIcon: React.ComponentType<{ className?: string }>
  eyebrowClass: string
  value: string
  valueClass: string
  note?: string
}) {
  return (
    <div className="min-w-0 space-y-1">
      <div
        className={cn(
          "flex items-center gap-1.5 text-[13px] font-medium",
          eyebrowClass
        )}
      >
        <Icon className="size-3.5" />
        {eyebrow}
      </div>
      <div className={cn("font-heading font-semibold", valueClass)}>
        {value}
      </div>
      {note && (
        <p className="max-w-prose text-[13px] text-muted-foreground">{note}</p>
      )}
    </div>
  )
}

function relativeMonths(months: number | null): string {
  if (months === null) return "at some point"
  if (months < 0) return "already"
  if (months === 0) return "this month"
  if (months === 1) return "next month"
  return `in ${months} months`
}

/** "21 years, 4 months" — time is the hook, so it gets words not digits. */
function durationWords(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} year${years === 1 ? "" : "s"}`)
  if (rest > 0) parts.push(`${rest} month${rest === 1 ? "" : "s"}`)
  return parts.join(", ") || "under a month"
}

function rateWord(rateType: Mortgage["rateType"]): string {
  return rateType === "fixed" ? "fixed" : rateType
}

const MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
})
const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
})
const SHORT_DATE = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
})

function monthYear(date: Date): string {
  return MONTH_YEAR.format(date)
}

function longDate(date: Date): string {
  return LONG_DATE.format(date)
}

function shortDate(dateKey: string | null): string {
  if (!dateKey) return "your deal ends"
  return SHORT_DATE.format(new Date(`${dateKey}T00:00:00`))
}
