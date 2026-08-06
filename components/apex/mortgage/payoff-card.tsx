import { Flag } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import {
  monthlyPayment,
  monthsBetween,
  monthsFromNow,
} from "@/lib/apex/mortgage/amortization"
import { parseDay } from "@/lib/apex/dates"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatMonthYear } from "./format"

/**
 * When the debt actually clears, drawn as a race to a finish line.
 *
 * The flag is the point: a marked finish is understood at a glance, where a
 * coloured bar has to be interpreted first. The track runs from today to
 * whichever comes last, the payoff or the contractual term end, so the gap
 * between "where you cross" and "where you were meant to cross" is a length
 * you can see rather than a subtraction you have to perform.
 */
export function PayoffCard({
  mortgage,
  status,
  today,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  /** yyyy-mm-dd resolved server-side, the same clock status was computed on */
  today: string
  className?: string
}) {
  const now = parseDay(today)
  const termMonths = Math.max(0, monthsBetween(now, parseDay(mortgage.termEndsOn)))
  const termLabel = formatMonthYear(mortgage.termEndsOn)

  // Interest-only never clears itself: the capital falls due as a lump sum,
  // so the finish line is the term end and the whole track leads to it.
  if (status.lumpSumAtTerm) {
    return (
      <Shell description="The term end on file" className={className}>
        <ApexStatValue>{termLabel}</ApexStatValue>
        <ApexStatHint className="mt-1.5">
          {`${formatPenceShort(status.balanceToday)} falls due in one go`}
        </ApexStatHint>
        <FinishTrack
          finishPct={100}
          overshoot={false}
          tone="warn"
          startLabel="Today"
          finishLabel={termLabel}
        />
        <FooterNote>
          {mortgage.repaymentType === "interest_only"
            ? "Your payments cover the interest only, so the capital is still owed in full at the end."
            : "Part of this loan is interest only, so some of the capital is still owed at the end."}
        </FooterNote>
      </Shell>
    )
  }

  if (status.monthsToFree === null) {
    return (
      <Shell description="At today's payment and rate" className={className}>
        <ApexStatValue className="text-muted-foreground">
          Never, at this payment
        </ApexStatValue>
        <ApexStatHint className="mt-1.5 font-medium text-destructive">
          {`The payment doesn't cover the interest, so the balance never reaches zero.`}
        </ApexStatHint>
      </Shell>
    )
  }

  const payoffMonths = status.monthsToFree
  const payoffLabel = formatMonthYear(monthsFromNow(payoffMonths, now))
  const delta = payoffMonths - termMonths
  const span = Math.max(payoffMonths, termMonths, 1)

  return (
    <Shell description="At today's payment and rate" className={className}>
      <ApexStatValue>{payoffLabel}</ApexStatValue>
      <p
        className={cn(
          "mt-1.5 text-[13px] font-medium",
          delta > 0
            ? "text-red-600 dark:text-red-400"
            : delta < 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
        )}
      >
        {verdict(delta, termLabel)}
      </p>

      <FinishTrack
        finishPct={(payoffMonths / span) * 100}
        markerPct={delta > 0 ? (termMonths / span) * 100 : null}
        overshoot={delta > 0}
        tone={delta > 0 ? "bad" : "good"}
        startLabel="Today"
        finishLabel={payoffLabel}
        markerLabel={termLabel}
      />

      <FooterNote>{fix(mortgage, status, termMonths, delta)}</FooterNote>
    </Shell>
  )
}

/**
 * The track. Green up to the finish, the overshoot beyond the term drawn in
 * red, and the flag planted where the debt actually clears. `translateX` is
 * interpolated by position so the flag stays inside the card at either end.
 */
function FinishTrack({
  finishPct,
  markerPct = null,
  overshoot,
  tone,
  startLabel,
  finishLabel,
  markerLabel,
}: {
  /** 0 to 100: where the debt clears along the track */
  finishPct: number
  /** 0 to 100: the contractual term end, when it falls before the finish */
  markerPct?: number | null
  overshoot: boolean
  tone: "good" | "bad" | "warn"
  startLabel: string
  finishLabel: string
  markerLabel?: string
}) {
  const finish = Math.min(100, Math.max(0, finishPct))
  const green = overshoot && markerPct !== null ? markerPct : finish

  return (
    <div className="mt-5">
      <div className="relative">
        {/* The flag sits above the track, its pole landing on the finish */}
        <span
          className={cn(
            "absolute -top-4 flex items-end",
            tone === "bad"
              ? "text-red-600 dark:text-red-400"
              : tone === "warn"
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
          )}
          style={{
            left: `${finish}%`,
            transform: `translateX(-${finish}%)`,
          }}
        >
          <Flag aria-hidden className="size-4" />
        </span>

        <div
          role="img"
          aria-label={`Today to ${finishLabel}${markerLabel && overshoot ? `, with the ${markerLabel} term end passed on the way` : ""}.`}
          className="flex h-3 w-full items-stretch gap-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="rounded-full bg-emerald-500"
            style={{ width: `${green}%` }}
          />
          {overshoot && markerPct !== null && (
            <div
              className="rounded-full bg-red-500"
              style={{ width: `${finish - markerPct}%` }}
            />
          )}
        </div>

        {/* The line you were meant to cross, when you cross it late */}
        {overshoot && markerPct !== null && (
          <span
            aria-hidden
            className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-foreground/40"
            style={{
              left: `${markerPct}%`,
              transform: `translateX(-${markerPct}%) translateY(-50%)`,
            }}
          />
        )}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{startLabel}</span>
        <span>{finishLabel}</span>
      </div>
    </div>
  )
}

/** How the payoff sits against the contract, in words. */
function verdict(delta: number, termLabel: string): string {
  if (delta === 0) return `Right on your ${termLabel} term end`
  const span = spanWords(Math.abs(delta))
  return delta > 0
    ? `${span} past your ${termLabel} term end`
    : `${span} before your ${termLabel} term end`
}

/** 28 → "2 years 4 months", 7 → "7 months", 24 → "2 years" */
function spanWords(months: number): string {
  const years = Math.floor(months / 12)
  const rest = months % 12
  const yearPart = years === 1 ? "1 year" : `${years} years`
  const monthPart = rest === 1 ? "1 month" : `${rest} months`
  if (years === 0) return monthPart
  if (rest === 0) return yearPart
  return `${yearPart} ${monthPart}`
}

/**
 * What to do about it. A payment that misses the term end usually means a
 * stale figure rather than a lender's error, so this prices the gap and
 * leaves the diagnosis alone.
 */
function fix(
  mortgage: Mortgage,
  status: MortgageStatus,
  termMonths: number,
  delta: number
): string {
  if (delta > 0 && termMonths > 0) {
    const needed = monthlyPayment(
      status.balanceToday,
      mortgage.interestRate,
      termMonths
    )
    const extra = needed - mortgage.monthlyPayment
    if (extra > 0) {
      return `${formatPence(extra)} a month more would clear it by the term end. Worth checking the payment on file is current.`
    }
  }
  if (delta < 0) {
    return `Overpaying brings this forward: every extra pound goes straight at the balance.`
  }
  return `This assumes today's rate holds for the whole run, which no rate does.`
}

function FooterNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto pt-4">
      <p className="border-t pt-3 text-[12px] leading-snug text-muted-foreground">
        {children}
      </p>
    </div>
  )
}

/** One shell for every state, so the card reads the same however it resolves. */
function Shell({
  description,
  className,
  children,
}: {
  description: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <ApexStatCard
      label="Paid off"
      description={description}
      icon={Flag}
      iconClassName={ANCHOR_TINTS.due}
      className={className}
    >
      {children}
    </ApexStatCard>
  )
}
