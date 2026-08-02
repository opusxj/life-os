"use client"

import * as React from "react"
import { TrendingDown } from "lucide-react"
import { useMotionValueEvent, useReducedMotion, useSpring } from "motion/react"

import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { Slider } from "@/components/ui/slider"
import {
  monthsFromNow,
  overpaymentImpact,
} from "@/lib/apex/mortgage/amortization"

import {
  EMERALD_ANCHOR,
  formatMonthYear,
  formatPounds,
  pluralMonths,
} from "./format"

const MAX_EXTRA = 500
const STEP = 25
const HOUSE_SPRING = { stiffness: 500, damping: 32 }

/**
 * What would overpaying do? Pure client-side amortization — the slider drives
 * the maths live and nothing is ever stored (apex.md decision #10).
 */
export function WhatIfCard({
  balance,
  interestRate,
  monthlyPayment,
}: {
  balance: number
  interestRate: number
  monthlyPayment: number
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
        iconClassName={EMERALD_ANCHOR}
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
      iconClassName={EMERALD_ANCHOR}
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
        <Slider
          value={[extra]}
          min={0}
          max={MAX_EXTRA}
          step={STEP}
          onValueChange={(value) =>
            setExtra(Array.isArray(value) ? value[0] : value)
          }
          aria-label="Extra monthly overpayment"
        />
        <span className="w-20 shrink-0 text-right text-[11px] font-medium text-muted-foreground tabular-nums">
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

  useMotionValueEvent(spring, "change", (latest) => setDisplay(latest))

  return <span className="tabular-nums">{formatPounds(display)}</span>
}
