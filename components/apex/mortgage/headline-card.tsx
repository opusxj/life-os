import { ArrowRight, CalendarClock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatPence } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { mortgageStatus, type MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

/**
 * Zone 1: what you pay now, and what it becomes when the deal ends.
 *
 * Lenders show the date a fixed rate ends. None of them shows the payment it
 * turns into, which is the number people actually act on. The content is the
 * same whatever the urgency; only the accent and the countdown change, so the
 * card reads identically in a quiet year and a decisive month.
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
  const accent = ACCENT[status.stage]

  return (
    <Card size="sm" className={className}>
      <CardHeader className="border-b">
        <CardTitle>{TITLE[status.stage]}</CardTitle>
        <CardDescription className="text-[13px]">
          {description(mortgage, status)}
        </CardDescription>
        <CardAction>
          <Countdown status={status} />
        </CardAction>
      </CardHeader>

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
              label={afterLabel(mortgage, status)}
              amount={status.reversionPayment}
              caption={`${mortgage.reversionRate}% standard rate`}
              width={barWidth(status.reversionPayment, mortgage.monthlyPayment)}
              tone={accent.tone}
            />
          ) : (
            <UnknownColumn lender={mortgage.lender} />
          )}
        </div>

        {status.shock !== null && status.shock !== 0 && (
          <p className={cn("mt-4 text-[13px] font-medium", accent.text)}>
            {shockSentence(status.shock)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

const TITLE = {
  settled: "Your rate",
  watch: "Your rate",
  act: "Your rate is ending",
  reverted: "You're on the standard rate",
} as const

const ACCENT = {
  settled: { text: "text-muted-foreground", tone: "neutral" },
  watch: { text: "text-muted-foreground", tone: "neutral" },
  act: { text: "text-amber-600 dark:text-amber-400", tone: "warn" },
  reverted: { text: "text-destructive", tone: "bad" },
} as const

type Tone = "current" | "neutral" | "warn" | "bad"

const BAR: Record<Tone, string> = {
  current: "bg-foreground/25",
  neutral: "bg-foreground/45",
  warn: "bg-amber-500",
  bad: "bg-destructive",
}

function description(mortgage: Mortgage, status: MortgageStatus): string {
  if (status.stage === "reverted") {
    return "Your fixed deal has ended. A product transfer with your existing lender is usually the quickest way onto a new rate."
  }
  if (!mortgage.rateEndsOn) {
    return "This rate has no end date, so your payment only moves if the rate does."
  }
  if (status.missing === "reversion_rate") {
    return `Add ${mortgage.lender}'s standard rate to see what your payment becomes when this deal ends.`
  }
  if (status.stage === "act") {
    return `Most lenders let you reserve a new deal up to six months ahead, so you can arrange one now.`
  }
  return "What your payment becomes when this deal ends, if you do nothing."
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

/** One side of the comparison. The bar makes the gap readable before the digits. */
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
  tone: Tone
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="font-heading text-2xl font-semibold tabular-nums">
        {formatPence(amount)}
      </div>
      <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", BAR[tone])}
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

function afterLabel(mortgage: Mortgage, status: MortgageStatus): string {
  if (status.stage === "reverted") return "Paying before it ended"
  if (!mortgage.rateEndsOn) return "On the standard rate"
  return `From ${monthAfter(mortgage.rateEndsOn)}`
}

function shockSentence(shock: number): string {
  const amount = formatPence(Math.abs(shock))
  const yearly = formatPence(Math.abs(shock) * 12)
  return shock > 0
    ? `${amount} a month more, or ${yearly} a year.`
    : `${amount} a month less, or ${yearly} a year.`
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
  month: "long",
  year: "numeric",
})

/** The new payment starts the month after the deal ends. */
function monthAfter(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`)
  return MONTH_YEAR.format(new Date(date.getFullYear(), date.getMonth() + 1, 1))
}
