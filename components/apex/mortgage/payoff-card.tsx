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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
          markerPct={100}
          overshoot={false}
          tone="warn"
          startLabel="Today"
          finishLabel={termLabel}
          markerLabel={termLabel}
        />
        <FooterNote>
          {mortgage.repaymentType === "interest_only"
            ? "Your payments cover the interest only."
            : "Part of this loan is interest only."}
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
          {`The payment doesn't cover the interest`}
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
        {verdict(delta)}
      </p>

      <FinishTrack
        finishPct={(payoffMonths / span) * 100}
        markerPct={(termMonths / span) * 100}
        overshoot={delta > 0}
        tone={delta > 0 ? "bad" : "good"}
        startLabel="Today"
        // The right-hand label is whatever the track actually ends on
        finishLabel={delta > 0 ? payoffLabel : termLabel}
        markerLabel={termLabel}
      />

      <FooterNote>{fix(mortgage, status, termMonths, delta)}</FooterNote>
    </Shell>
  )
}

/** Nothing to say is a valid outcome: the card ends at the ruler. */
function FooterNote({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <div className="mt-auto pt-4">
      <p className="border-t pt-3 text-[12px] leading-snug text-muted-foreground">
        {children}
      </p>
    </div>
  )
}

/**
 * A ruler, not a meter. Deliberately a thinner class of graphic than the
 * segment bars elsewhere on the page: this card measures a span of years
 * rather than dividing a whole, and a hairline with markers reads as a
 * calendar where a fat rounded bar reads as progress toward a target.
 *
 * Solid to whichever comes first, dashed beyond it, because a dashed run is
 * road that was never meant to be travelled. The flag is planted where the
 * debt clears; the ring is the term end you were contracted to.
 */
function FinishTrack({
  finishPct,
  markerPct,
  overshoot,
  tone,
  startLabel,
  finishLabel,
  markerLabel,
}: {
  /** 0 to 100: where the debt clears along the track */
  finishPct: number
  /** 0 to 100: the contractual term end */
  markerPct: number
  overshoot: boolean
  tone: "good" | "bad" | "warn"
  startLabel: string
  finishLabel: string
  markerLabel: string
}) {
  const finish = Math.min(100, Math.max(0, finishPct))
  const marker = Math.min(100, Math.max(0, markerPct))
  const solid = Math.min(finish, marker)
  const flagTone =
    tone === "bad"
      ? "text-red-600 dark:text-red-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400"

  return (
    <div className="mt-5">
      {/* The right margin is the flag's room, so it never clips at 100% */}
      <div
        role="img"
        aria-label={`Today to ${finishLabel}, against the ${markerLabel} term end.`}
        className="relative mr-5 h-5"
      >
        {/* Start tick */}
        <span
          aria-hidden
          className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-border"
        />

        {/* The run you are contracted for */}
        <span
          aria-hidden
          className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-emerald-500"
          style={{ width: `${solid}%` }}
        />

        {/* Beyond the finish or beyond the term: road that shouldn't be there */}
        {finish !== marker && (
          <span
            aria-hidden
            className={cn(
              "absolute top-1/2 -translate-y-1/2 border-t-2 border-dashed",
              overshoot ? "border-red-500" : "border-border"
            )}
            style={{
              left: `${solid}%`,
              width: `${Math.abs(finish - marker)}%`,
            }}
          />
        )}

        {/* The term end: a ring on the line, explaining itself on hover */}
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                className="absolute top-1/2 size-2.5 cursor-help rounded-full border-2 border-foreground/40 bg-card"
                style={{
                  left: `${marker}%`,
                  transform: `translateX(-${marker}%) translateY(-50%)`,
                }}
              />
            }
          />
          <TooltipContent>{`Term ends ${markerLabel}`}</TooltipContent>
        </Tooltip>

        {/* The finish: the pole lands on the line, the flag flies right into
            the margin, so it never clips however late the payoff runs */}
        <span
          className="absolute bottom-1/2"
          style={{ left: `${finish}%` }}
        >
          <Flag aria-hidden className={cn("size-4", flagTone)} />
        </span>
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{startLabel}</span>
        <span>{finishLabel}</span>
      </div>
    </div>
  )
}

/** How the payoff sits against the contract. The ruler shows the gap; this
 *  only has to name it, so it stays to three words where it can. */
function verdict(delta: number): string {
  if (delta === 0) return "Exactly on term"
  return `${spanWords(Math.abs(delta))} ${delta > 0 ? "late" : "early"}`
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
 * The one instruction, and only when it applies. What the figure means, and
 * whether the cause is a stale payment or a balance that has slipped behind,
 * is the reader's to draw: the app cannot tell the difference from what it
 * holds, and guessing out loud on a money page costs more than it gives.
 */
function fix(
  mortgage: Mortgage,
  status: MortgageStatus,
  termMonths: number,
  delta: number
): string | null {
  if (delta <= 0 || termMonths <= 0) return null
  const needed = monthlyPayment(
    status.balanceToday,
    mortgage.interestRate,
    termMonths
  )
  if (needed <= mortgage.monthlyPayment) return null
  return `${formatPence(needed)} a month clears the term.`
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
