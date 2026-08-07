"use client"

import * as React from "react"
import { TrendingDown } from "lucide-react"
import { useMotionValueEvent, useReducedMotion, useSpring } from "motion/react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { MeterHead } from "@/components/apex/meter"
import { DataProgress } from "@/components/apex/progress"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatTag,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { Slider } from "@/components/ui/slider"
import { parseDay } from "@/lib/apex/dates"
import {
  monthsBetween,
  monthsFromNow,
  overpaymentImpact,
  paymentToReach,
  projectBalance,
  type RateChange,
} from "@/lib/apex/mortgage/amortization"
import { nextBandDown } from "@/lib/apex/mortgage/bands"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { lendingBase, type MortgageStatus } from "@/lib/apex/mortgage/status"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import { cn } from "@/lib/utils"

import { formatMonthYear, spanWords } from "./format"

/** The slider's ceiling, in pence a month. */
const MAX_EXTRA = 100_000
/** Drag granularity: £25. Presets set exact values regardless. */
const STEP = 2_500
const HOUSE_SPRING = { stiffness: 500, damping: 32 }

/**
 * The 10% norm on fixed deals: overpay more than this share of the balance in
 * a year and most lenders charge an early repayment charge. We never know THIS
 * deal's allowance, so the copy hedges ("most deals") rather than asserts.
 */
const ALLOWANCE_PCT = 0.1

/** Faint emerald wash — the one playable card on the page gets its own surface. */
const PLAY_SURFACE =
  "bg-emerald-500/[0.04] ring-emerald-500/15 dark:bg-emerald-500/[0.07] dark:ring-emerald-500/25"

/**
 * What would overpaying do? Pure client-side amortization — the presets and the
 * slider drive the maths live and nothing is ever stored (apex.md decision #10).
 *
 * The projection turns over at the deal end rather than holding today's rate for
 * the life of the loan. On this repo's own demo row that was not a rounding
 * matter: quoting 4.79% for twenty-five years on a deal with seven months left
 * understated the saving by £7,473 and overstated the time by nine months.
 *
 * The presets are the point of the rework. A bare slider over a thousand pounds
 * in twenty-five pound steps is forty-one positions and no opinion, which is a
 * poor thing to hand someone meeting overpayments for the first time. Rounding
 * the payment up to the next hundred is what people actually do; the band preset
 * is the exact figure the Loan to value card names, so the two cards agree by
 * construction rather than by coincidence.
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
  const [extra, setExtra] = React.useState(10_000)

  const now = parseDay(today)
  const change = rateChange(mortgage, status, now)
  const impact = overpaymentImpact(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    extra,
    change
  )

  const allowance = Math.round((status.balanceToday * ALLOWANCE_PCT) / 100) * 100
  const presets = buildPresets(mortgage, status)

  if (!impact) {
    return (
      <Shell className={className}>
        <ApexStatValue className="text-muted-foreground">—</ApexStatValue>
        <ApexStatHint>Needs a payment that covers the interest</ApexStatHint>
      </Shell>
    )
  }

  const payoff = formatMonthYear(monthsFromNow(impact.accelerated.months, now))
  // What the instruction actually asks of you, over the life it now has
  const committed = extra * impact.accelerated.months
  const scale = Math.max(committed, impact.interestSaved, 1)
  const overAllowance = extra * 12 > allowance

  return (
    <Shell className={className}>
      {/* Dragged to nothing, the figure is not a saving and should not wear the
          colour of one; the hint below turns into the invitation instead. */}
      <ApexStatValue
        className={
          extra > 0
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground"
        }
      >
        <AnimatedPounds pence={impact.interestSaved} />{" "}
        <ApexStatUnit>interest saved</ApexStatUnit>
      </ApexStatValue>
      <ApexStatHint>
        {extra === 0
          ? "Pick an amount, or drag, to try an overpayment"
          : `Paid off ${spanWords(impact.monthsSaved)} sooner, in ${payoff}`}
      </ApexStatHint>

      {/* Amounts that mean something, before the open-ended one */}
      {presets.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setExtra(preset.extra)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                "hover:bg-emerald-500/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                extra === preset.extra
                  ? "border-emerald-500/40 bg-emerald-500/15 font-medium text-emerald-700 dark:text-emerald-300"
                  : "text-muted-foreground"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2.5 pt-2.5">
        {/* The track carries its own limits: where the next pricing band is
            reached, and where most deals start charging for the privilege.
            A ceiling you can see coming beats one that fires a warning. */}
        <span className="relative flex-1">
          <Slider
            value={[extra]}
            min={0}
            max={MAX_EXTRA}
            step={STEP}
            onValueChange={(value) =>
              setExtra(Array.isArray(value) ? value[0] : value)
            }
            className="*:py-2 [&_[data-slot=slider-range]]:bg-emerald-500"
            aria-label="Extra monthly overpayment"
          />
          {presets
            .filter((preset) => preset.mark)
            .map((preset) => (
              <span
                key={preset.label}
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-1/2 h-3 w-px -translate-y-1/2",
                  preset.mark
                )}
                style={{ left: `${(preset.extra / MAX_EXTRA) * 100}%` }}
              />
            ))}
          {allowance / 12 < MAX_EXTRA && (
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 h-3 w-px -translate-y-1/2 bg-amber-500"
              style={{ left: `${(allowance / 12 / MAX_EXTRA) * 100}%` }}
            />
          )}
        </span>
        <ApexStatTag tint="balance" className="w-31 shrink-0 justify-center">
          {`${formatPence(extra)} a month`}
        </ApexStatTag>
      </div>

      {/* What it asks of you, against what it gives back. The saving alone is
          half the picture: it is bought with a standing order that runs for
          most of the term, and that belongs on the same card at the same size. */}
      {extra > 0 && (
        <div
          role="img"
          aria-label={`${formatPence(extra)} a month for ${spanWords(impact.accelerated.months)} commits ${formatPenceShort(committed)} and saves ${formatPenceShort(impact.interestSaved)} in interest.`}
        >
          <MeterHead
            className="mt-4"
            name={`What it commits, over ${spanWords(impact.accelerated.months)}`}
            amount={formatPenceShort(committed)}
          />
          <DataProgress
            value={(committed / scale) * 100}
            color="var(--color-muted-foreground)"
          />
          <MeterHead
            className="mt-3.5"
            name="What it saves"
            amount={formatPenceShort(impact.interestSaved)}
          />
          <DataProgress
            value={(impact.interestSaved / scale) * 100}
            color="var(--color-emerald-500)"
          />
        </div>
      )}

      <div className="mt-auto pt-4">
        <p
          className={cn(
            "border-t pt-3 text-[12px] leading-snug",
            overAllowance
              ? "font-medium text-amber-600 dark:text-amber-400"
              : "text-muted-foreground"
          )}
        >
          {overAllowance
            ? `${formatPenceShort(extra * 12)} a year is above the 10% allowance most deals give. Check your deal before overpaying this much.`
            : `Most deals allow ${formatPenceShort(allowance)} a year before an early repayment charge.`}
        </p>
      </div>
    </Shell>
  )
}

/** One shell for every state, so the card reads the same however it resolves. */
function Shell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <ApexStatCard
      label="Overpaying"
      description="Nothing here is saved"
      icon={TrendingDown}
      iconClassName={ANCHOR_TINTS.balance}
      className={cn(PLAY_SURFACE, className)}
    >
      {children}
    </ApexStatCard>
  )
}

type Preset = {
  label: string
  /** Pence a month */
  extra: number
  /** A class for its mark on the slider track, when it earns one */
  mark?: string
}

/**
 * Amounts worth offering, cheapest thought first.
 *
 * Rounding the payment up to the next hundred is the overpayment people
 * actually make, because it is the one you can hold in your head. The band
 * preset is the figure the Loan to value card prints, computed the same way
 * from the same helpers, so the cards cannot drift apart.
 */
function buildPresets(mortgage: Mortgage, status: MortgageStatus): Preset[] {
  const presets: Preset[] = []

  const roundUp =
    Math.ceil((mortgage.monthlyPayment + 1) / 10_000) * 10_000 -
    mortgage.monthlyPayment
  if (roundUp > 0 && roundUp <= MAX_EXTRA) {
    presets.push({
      label: `Round up to ${formatPenceShort(mortgage.monthlyPayment + roundUp)}`,
      extra: roundUp,
    })
  }

  presets.push({ label: formatPenceShort(10_000), extra: 10_000 })

  const band = bandPreset(mortgage, status)
  if (band && !presets.some((preset) => preset.extra === band.extra)) {
    presets.push(band)
  }
  return presets
}

/**
 * The overpayment that reaches the next pricing band before the deal ends.
 *
 * Measured at the deal end, not at some point years out, for the reason the
 * Loan to value card is: past that date the rate changes and the projection
 * stops meaning anything. Null when there is no deal to remortgage out of, no
 * band left above, or the figure is off the slider.
 */
function bandPreset(
  mortgage: Mortgage,
  status: MortgageStatus
): Preset | null {
  const lending = lendingBase(mortgage)
  const months = status.monthsToRateEnd
  if (lending === null || months === null || months <= 0) return null
  if (mortgage.repaymentType !== "repayment") return null

  const assessed = projectBalance(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    months,
    mortgage.repaymentType
  )
  const next = nextBandDown(assessed, lending.value)
  if (next === null) return null

  const needed = paymentToReach(
    status.balanceToday,
    mortgage.interestRate,
    months,
    next.balance
  )
  if (needed === null) return null

  const extra = Math.ceil((needed - mortgage.monthlyPayment) / 100) * 100
  if (extra <= 0 || extra > MAX_EXTRA) return null

  return {
    label: `${formatPenceShort(extra)}, reaches ${next.band}%`,
    extra,
    mark: "bg-indigo-500 dark:bg-indigo-400",
  }
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
  // ("£3,412.37") and jitter the hero's width between two round rest states
  useMotionValueEvent(spring, "change", (latest) =>
    setDisplay(Math.round(latest / 100) * 100)
  )

  return <span className="tabular-nums">{formatPenceShort(display)}</span>
}
