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

import { FinishTrack } from "./finish-track"
import { formatMonthYear, spanWords } from "./format"

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
          markerTip={`Term ends ${termLabel}`}
          label={`Today to ${termLabel}, when the balance falls due.`}
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
        markerTip={`Term ends ${termLabel}`}
        label={`Today to ${delta > 0 ? payoffLabel : termLabel}, against the ${termLabel} term end.`}
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

/** How the payoff sits against the contract. The ruler shows the gap; this
 *  only has to name it, so it stays to three words where it can. */
function verdict(delta: number): string {
  if (delta === 0) return "Exactly on term"
  return `${spanWords(Math.abs(delta))} ${delta > 0 ? "late" : "early"}`
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
