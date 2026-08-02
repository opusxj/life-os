"use client"

import * as React from "react"
import { useMotionValueEvent, useReducedMotion, useSpring } from "motion/react"

import { Slider } from "@/components/ui/slider"
import {
  monthsFromNow,
  overpaymentImpact,
} from "@/lib/apex/mortgage/amortization"

import { formatMonthYear, formatPounds, pluralMonths } from "./format"
import { StatCard, StatSupport, StatValue } from "./stat-card"

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
      <StatCard label="Overpayment what-if">
        <StatValue className="text-muted-foreground">—</StatValue>
        <StatSupport>{`Needs a payment that covers the interest`}</StatSupport>
      </StatCard>
    )
  }

  const payoff = formatMonthYear(monthsFromNow(impact.accelerated.months))

  return (
    <StatCard label="Overpayment what-if">
      <StatValue className="text-emerald-600 dark:text-emerald-400">
        <AnimatedPounds pence={impact.interestSaved} />
      </StatValue>
      <StatSupport>
        {extra === 0
          ? `Drag the slider to try an overpayment`
          : `Interest saved · paid off ${payoff}, ${pluralMonths(impact.monthsSaved)} sooner`}
      </StatSupport>
      <div className="flex items-center gap-2.5 pt-1">
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
    </StatCard>
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
