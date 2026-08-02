"use client"

import * as React from "react"
import { TrendingDown } from "lucide-react"
import { useMotionValueEvent, useReducedMotion, useSpring } from "motion/react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { Slider } from "@/components/ui/slider"
import { formatPenceShort } from "@/lib/apex/money"
import {
  monthsFromNow,
  overpaymentImpact,
} from "@/lib/apex/mortgage/amortization"
import { cn } from "@/lib/utils"

import { formatMonthYear, pluralMonths } from "./format"

const MAX_EXTRA = 500
const STEP = 25
const HOUSE_SPRING = { stiffness: 500, damping: 32 }

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
  className,
}: {
  balance: number
  interestRate: number
  monthlyPayment: number
  className?: string
}) {
  const [extra, setExtra] = React.useState(100)
  const impact = React.useMemo(
    () => overpaymentImpact(balance, interestRate, monthlyPayment, extra * 100),
    [balance, interestRate, monthlyPayment, extra]
  )

  if (!impact) {
    return (
      <ApexStatCard
        label="Overpayment what-if"
        icon={TrendingDown}
        iconClassName={ANCHOR_TINTS.balance}
        className={cn(PLAY_SURFACE, className)}
      >
        <ApexStatValue className="text-muted-foreground">—</ApexStatValue>
        <ApexStatHint>{`Needs a payment that covers the interest`}</ApexStatHint>
      </ApexStatCard>
    )
  }

  const payoff = formatMonthYear(monthsFromNow(impact.accelerated.months))

  return (
    <ApexStatCard
      label="Overpayment what-if"
      icon={TrendingDown}
      iconClassName={ANCHOR_TINTS.balance}
      className={cn(PLAY_SURFACE, className)}
    >
      <ApexStatValue className="text-emerald-600 dark:text-emerald-400">
        <AnimatedPounds pence={impact.interestSaved} />
      </ApexStatValue>
      <ApexStatHint>
        {extra === 0
          ? `Drag the slider to try an overpayment`
          : `Interest saved · paid off ${payoff}, ${pluralMonths(impact.monthsSaved)} sooner`}
      </ApexStatHint>
      <div className="flex items-center gap-2.5 pt-2.5">
        {/* *:py-2 pads the slider's control — a taller touch target, same track */}
        <Slider
          value={[extra]}
          min={0}
          max={MAX_EXTRA}
          step={STEP}
          onValueChange={(value) =>
            setExtra(Array.isArray(value) ? value[0] : value)
          }
          className="*:py-2"
          aria-label="Extra monthly overpayment"
        />
        <span className="w-20 shrink-0 text-right text-[13px] font-semibold text-foreground tabular-nums">
          {`+£${extra}/mo`}
        </span>
      </div>
    </ApexStatCard>
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

  useMotionValueEvent(spring, "change", (latest) =>
    setDisplay(Math.round(latest))
  )

  return <span className="tabular-nums">{formatPenceShort(display)}</span>
}
