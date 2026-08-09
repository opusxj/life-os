"use client"

import * as React from "react"
import { TrendingDown } from "lucide-react"
import { useMotionValueEvent, useReducedMotion, useSpring } from "motion/react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexCardFootnote,
  ApexStatCard,
  ApexStatFigure,
  ApexStatHint,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { Slider } from "@/components/ui/slider"
import { parseDay } from "@/lib/apex/dates"
import { HOUSE_SPRING } from "@/lib/motion"
import {
  monthsBetween,
  monthsFromNow,
  overpaymentImpact,
  type RateChange,
} from "@/lib/apex/mortgage/amortization"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import {
  overpaymentAllowance,
  type MortgageStatus,
} from "@/lib/apex/mortgage/status"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import { cn } from "@/lib/utils"

import { FinishTrack } from "./finish-track"
import { formatMonthYear, formatShare, spanWords } from "./format"

/** Drag granularity: £25. */
const STEP = 2_500

/** Faint emerald wash — the one playable card on the page gets its own surface. */
const PLAY_SURFACE =
  "bg-emerald-500/[0.04] ring-emerald-500/15 dark:bg-emerald-500/[0.07] dark:ring-emerald-500/25"

/**
 * What would overpaying do? Pure client-side amortization — the slider drives
 * the maths live and nothing is ever stored (apex.md decision #10).
 *
 * The saving leads in pounds and the years are drawn. The hero is the rounded
 * interest saved, the months ride beneath it in one quiet line (two figures
 * side by side read as clutter; taste log), and the same finish-flag ruler the
 * Paid off card taught plots both finishes, so dragging the slider slides the
 * flag and grows the dashed run of road you no longer travel. mortgage.md §F6
 * wants both numbers shown with time as the hook; here the ruler IS the time,
 * so the words can lead with money. The interest figure is rounded hard for
 * §F6's other reason: the same inputs across a plausible rate band swing it
 * several-fold, and pence precision would be confidence the model cannot
 * support. The exact payoff month lives on the flag's hover, demoted from
 * claim to detail.
 *
 * The projection turns over at the deal end rather than holding today's rate
 * for the life of the loan. On this repo's own demo row that was not a
 * rounding matter: quoting 4.79% for twenty-five years on a deal with seven
 * months left understated the saving by £7,473 and overstated the time by
 * nine months.
 */
export function WhatIfCard({
  mortgage,
  status,
  today,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  /** yyyy-mm-dd resolved server-side so the payoff month can't drift from the
   *  clock the rest of the page was rendered against */
  today: string
  className?: string
}) {
  const [chosen, setExtra] = React.useState(10_000)

  const now = parseDay(today)
  const allowance = overpaymentAllowance(mortgage, status.balanceToday)
  const maxExtra = safeCeiling(allowance.yearly)
  // A smaller balance can shrink the ceiling under whatever was last chosen
  const extra = Math.min(chosen, maxExtra)

  const change = rateChange(mortgage, status, now)
  const impact = overpaymentImpact(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    extra,
    change
  )

  const basis = projectionBasis(mortgage, status)

  if (!impact) {
    return (
      <Shell description={basis} className={className}>
        <ApexStatValue className="text-muted-foreground">—</ApexStatValue>
        <ApexStatHint>Needs a payment that covers the interest</ApexStatHint>
      </Shell>
    )
  }

  const payoff = formatMonthYear(monthsFromNow(impact.accelerated.months, now))
  const baselineLabel = formatMonthYear(
    monthsFromNow(impact.baseline.months, now)
  )

  return (
    <Shell description={basis} className={className}>
      {/* At rest the hero is the payment you already make: the baseline every
          figure on the card is measured against, and a real number where a
          grey zero said nothing. The rest of the anatomy stays put either way,
          because an empty state that hides the ruler hides what the card is
          for. */}
      {extra === 0 ? (
        <ApexStatValue>
          <ApexStatFigure>{formatPence(mortgage.monthlyPayment)}</ApexStatFigure>{" "}
          <ApexStatUnit>a month today</ApexStatUnit>
        </ApexStatValue>
      ) : (
        <ApexStatValue
          className={
            impact.interestSaved > 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          }
        >
          <ApexStatUnit>Around</ApexStatUnit>{" "}
          <AnimatedPounds pence={roundSaving(impact.interestSaved)} />{" "}
          <ApexStatUnit>less interest</ApexStatUnit>
        </ApexStatValue>
      )}
      {/* Time rides under the money in one quiet line; the ruler below draws
          the same years as a length, which is where the emphasis lives. */}
      <ApexStatHint>
        {extra === 0
          ? "Drag to try an overpayment"
          : `${spanWords(impact.monthsSaved)} sooner, paying ${formatPence(mortgage.monthlyPayment + extra)} a month.`}
      </ApexStatHint>

      {/* The saving as a length. The solid run is the road you travel, the
          dashed run is road you no longer have to, and the gap grows under
          the thumb. Same ruler as the Paid off card, on purpose: a graphic
          the page already taught is understood before it is read. */}
      {impact.baseline.months > 0 && (
        <FinishTrack
          finishPct={(impact.accelerated.months / impact.baseline.months) * 100}
          markerPct={100}
          overshoot={false}
          tone="good"
          startLabel="Today"
          finishLabel={baselineLabel}
          markerTip="Where today's payment finishes"
          flagTip={`Clears ${payoff}`}
          label={`Today to ${payoff} with the overpayment, against ${baselineLabel} at today's payment.`}
        />
      )}

      {/* The track runs from nothing to the most you can overpay without a
          charge, so every position on it is safe and the far end answers "how
          much am I allowed". */}
      <div className="relative mt-4 pt-7">
        {/* The chosen amount rides the thumb instead of sitting in a pill
            beside the track: while dragging, the eye is on the thumb, and a
            static pill to the right read as a second fact off to the side.
            Fixed width so it doesn't jitter as digits change; centred on the
            thumb itself (whose centre travels the track minus its 12px), and
            clamp() pins it inside the card at both ends. */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 w-16 rounded-full bg-emerald-500/15 py-0.5 text-center text-[11px] font-medium whitespace-nowrap text-emerald-800 tabular-nums dark:bg-emerald-500/20 dark:text-emerald-300"
          style={{
            left: `clamp(0px, calc((100% - 12px) * ${thumbPct(extra, maxExtra) / 100} + 6px - 32px), calc(100% - 64px))`,
          }}
        >
          {`+${formatPenceShort(extra)}`}
        </span>
        <Slider
          value={[extra]}
          min={0}
          max={maxExtra}
          step={STEP}
          onValueChange={(value) =>
            setExtra(Array.isArray(value) ? value[0] : value)
          }
          className="*:py-2 [&_[data-slot=slider-range]]:bg-emerald-500"
          aria-label="Extra monthly overpayment"
        />
      </div>
      {/* The track as a labelled scale: it runs from no overpayment to the
          yearly cap, so the marks are shares of the balance a year, bare. The
          word "cap" and the hedge live in the footer, which only exists while
          the figure is assumed. */}
      <div className="relative mt-1 h-4 text-[11px] text-muted-foreground tabular-nums">
        <span className="absolute left-0">0%</span>
        <span className="absolute left-1/2 -translate-x-1/2">
          {`${formatShare(allowance.pct / 2)}%`}
        </span>
        <span className="absolute right-0">
          {`${formatShare(allowance.pct)}%`}
        </span>
      </div>

      {/* Purely the action, only while there is one to take; the LTV card's
          prompt grammar. A recorded cap needs no prose at all. */}
      {!allowance.isOwn && (
        <ApexCardFootnote>Edit the mortgage to add your current cap.</ApexCardFootnote>
      )}
    </Shell>
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
      label="Overpaying"
      description={description}
      icon={TrendingDown}
      iconClassName={ANCHOR_TINTS.balance}
      className={cn(PLAY_SURFACE, className)}
    >
      {children}
    </ApexStatCard>
  )
}

/**
 * Where the figures come from, which is the whole job of a provenance line.
 *
 * It used to read "Nothing here is saved", meaning nothing is written to your
 * mortgage. On a card whose hero reads "£29,327 interest saved" thirty pixels
 * below, that is one word in two senses and it landed as a contradiction: "what
 * does that even mean?". The reassurance was worth little anyway, since the card
 * has no form and no save to worry about, and it was displacing the one thing
 * this slot is for. Naming the rate change also says out loud that the
 * projection survives it, which is the fact that used to be wrong here.
 */
function projectionBasis(mortgage: Mortgage, status: MortgageStatus): string {
  const at = status.monthsToRateEnd
  if (
    at !== null &&
    at > 0 &&
    mortgage.reversionRate !== null &&
    mortgage.rateEndsOn
  ) {
    return `At today's payment, through your ${formatMonthYear(mortgage.rateEndsOn)} rate change`
  }
  return "At today's payment and rate"
}

/** Where the thumb sits along the track, for the bubble that rides it. */
function thumbPct(extra: number, maxExtra: number): number {
  if (maxExtra <= 0) return 0
  return Math.min(100, Math.max(0, (extra / maxExtra) * 100))
}

/**
 * The slider's ceiling: the most you can overpay in a month without most deals
 * charging for it.
 *
 * Bounding the control at the allowance rather than at a round number means
 * every position on the track is safe, which is a calmer thing to hand someone
 * than a slider whose upper reach is a trap sprung by a warning. It also makes
 * the far end the answer to "how much am I actually allowed", so that question
 * needs no extra furniture. The floor keeps a usable range on a small balance.
 */
function safeCeiling(allowance: number): number {
  return Math.max(2_500, Math.floor(allowance / 12 / 100) * 100)
}

/**
 * Round hard, per mortgage.md §F6: the model's rate assumptions swing this
 * figure several-fold, so the stated saving keeps only the confidence the
 * projection earns. The "or so" beside the figure carries the same hedge in
 * words.
 */
function roundSaving(pence: number): number {
  if (pence >= 1_000_000) return Math.round(pence / 100_000) * 100_000
  if (pence >= 100_000) return Math.round(pence / 10_000) * 10_000
  return Math.round(pence / 1_000) * 1_000
}

/** The reversion the projection has to survive, when one is on the calendar. */
function rateChange(
  mortgage: Mortgage,
  status: MortgageStatus,
  now: Date
): RateChange | undefined {
  const at = status.monthsToRateEnd
  if (at === null || at <= 0 || mortgage.reversionRate === null) return undefined
  return {
    at,
    ratePct: mortgage.reversionRate,
    termMonths: monthsBetween(now, parseDay(mortgage.termEndsOn)),
  }
}

/** Pounds figure that springs to new values on the house spring. */
function AnimatedPounds({ pence }: { pence: number }) {
  const reducedMotion = useReducedMotion()
  const spring = useSpring(pence, HOUSE_SPRING)
  const [display, setDisplay] = React.useState(pence)

  React.useEffect(() => {
    if (reducedMotion) spring.jump(pence)
    else spring.set(pence)
  }, [pence, reducedMotion, spring])

  // Whole pounds in flight: intermediate pence would flash false precision
  // ("£3,412.37") and jitter the figure's width between two round rest states
  useMotionValueEvent(spring, "change", (latest) =>
    setDisplay(Math.round(latest / 100) * 100)
  )

  return <span className="tabular-nums">{formatPenceShort(display)}</span>
}
