"use client"

import * as React from "react"
import { TrendingDown } from "lucide-react"
import { useMotionValueEvent, useReducedMotion, useSpring } from "motion/react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { Slider } from "@/components/ui/slider"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import {
  monthsFromNow,
  overpaymentImpact,
} from "@/lib/apex/mortgage/amortization"
import { cn } from "@/lib/utils"

import { formatMonthYear, pluralMonths } from "./format"

const MAX_EXTRA = 1000
const STEP = 25
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
 * What would overpaying do? Pure client-side amortization — the slider drives
 * the maths live and nothing is ever stored (apex.md decision #10).
 */
export function WhatIfCard({
  balance,
  interestRate,
  monthlyPayment,
  today,
  className,
}: {
  balance: number
  interestRate: number
  monthlyPayment: number
  /** yyyy-mm-dd resolved server-side so the payoff month can't drift from the
   *  clock the rest of the page was rendered against */
  today: string
  className?: string
}) {
  const [extra, setExtra] = React.useState(100)
  const impact = React.useMemo(
    () => overpaymentImpact(balance, interestRate, monthlyPayment, extra * 100),
    [balance, interestRate, monthlyPayment, extra]
  )

  // 10% of the balance a year, rounded to whole pounds for display
  const allowance = Math.round((balance * ALLOWANCE_PCT) / 100) * 100
  const annualExtra = extra * 1200
  const overAllowance = annualExtra > allowance

  if (!impact) {
    return (
      <ApexStatCard
        label="Overpayment what-if"
        description="At today's payment and rate. Nothing here is saved."
        icon={TrendingDown}
        iconClassName={ANCHOR_TINTS.balance}
        className={cn(PLAY_SURFACE, className)}
      >
        <ApexStatValue className="text-muted-foreground">—</ApexStatValue>
        <ApexStatHint>{`Needs a payment that covers the interest`}</ApexStatHint>
        <AllowanceLine allowance={allowance} />
      </ApexStatCard>
    )
  }

  const payoff = formatMonthYear(
    monthsFromNow(impact.accelerated.months, new Date(`${today}T00:00:00`))
  )
  const newPayment = formatPence(monthlyPayment + extra * 100)

  return (
    <ApexStatCard
      label="Overpayment what-if"
      description="At today's payment and rate. Nothing here is saved."
      icon={TrendingDown}
      iconClassName={ANCHOR_TINTS.balance}
      className={cn(PLAY_SURFACE, className)}
    >
      <ApexStatValue className="text-emerald-600 dark:text-emerald-400">
        <AnimatedPounds pence={impact.interestSaved} />{" "}
        <ApexStatUnit>interest saved</ApexStatUnit>
      </ApexStatValue>
      <ApexStatHint>
        {extra === 0
          ? `Drag the slider to try an overpayment`
          : `New payment ${newPayment}, paid off ${payoff}, ${pluralMonths(impact.monthsSaved)} sooner.`}
      </ApexStatHint>
      <div className="flex items-center gap-2.5 pt-2.5">
        {/* *:py-2 pads the slider's control — a taller touch target, same
            track. The range recolors to emerald so the one playable card
            stays inside its own vocabulary; primary is the headline's. */}
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
        <span className="w-28 shrink-0 text-right text-[13px] font-semibold text-foreground tabular-nums">
          {`+£${extra} a month`}
        </span>
      </div>
      <AllowanceLine
        allowance={allowance}
        annualExtra={overAllowance ? annualExtra : undefined}
      />
    </ApexStatCard>
  )
}

/**
 * The early repayment charge guardrail. Hedged on purpose: we know the norm
 * (10% of the balance a year on most fixed deals), never THIS deal's terms.
 * Passing `annualExtra` marks the play as above the norm and turns the line
 * amber.
 */
function AllowanceLine({
  allowance,
  annualExtra,
}: {
  /** 10% of the balance, pence, pre-rounded to whole pounds */
  allowance: number
  /** The slider's yearly total, pence — set only when it exceeds the allowance */
  annualExtra?: number
}) {
  return (
    <p
      className={cn(
        "pt-2 text-xs leading-snug",
        annualExtra === undefined
          ? "text-muted-foreground"
          : "text-amber-600 dark:text-amber-400"
      )}
    >
      {annualExtra === undefined
        ? `Most deals allow up to 10% of the balance in overpayments a year before an early repayment charge. Here that is about ${formatPenceShort(allowance)}.`
        : `${formatPenceShort(annualExtra)} a year is above the 10% allowance most deals give. Check your deal before overpaying this much.`}
    </p>
  )
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
