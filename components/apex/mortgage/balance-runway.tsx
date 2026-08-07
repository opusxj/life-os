"use client"

import * as React from "react"
import { Minus, Plus, Route } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { ApexStatCard } from "@/components/apex/stat-card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { parseDay } from "@/lib/apex/dates"
import {
  balanceSeries,
  balanceSeriesWithReversion,
  monthlyRate,
  monthsBetween,
} from "@/lib/apex/mortgage/amortization"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatMonthYear } from "./format"

/**
 * The fork in the road: your balance at today's rate, against your balance if
 * the deal ends and the rate reverts, with a stepper setting the second rate.
 *
 * Drawn deliberately light. A chart at dashboard weight sitting in a card of
 * 13px text reads as a pasted image, so the marks here are thinner than a
 * standalone chart would use: 1.75px lines, 3px end dots, 10px axis type.
 * Where a figure would have been printed on the plot it lives in a hover
 * instead, which is also what stops the thing feeling inert.
 *
 * Both lines hold the payment constant. A lender recalculates it on reversion
 * so the term still clears, which would lay the lines on top of each other
 * and hide the cost in a figure the chart never shows. Fixed, the cost is
 * the gap you can see.
 */
export function BalanceRunway({
  mortgage,
  status,
  today,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  /** yyyy-mm-dd resolved server-side so SSR and hydration agree */
  today: string
  className?: string
}) {
  const [afterRate, setAfterRate] = React.useState(
    mortgage.reversionRate ?? mortgage.interestRate
  )

  const now = parseDay(today)
  const termMonths = monthsBetween(now, parseDay(mortgage.termEndsOn))
  const payment = mortgage.monthlyPayment
  const balance = status.balanceToday
  const flat = mortgage.repaymentType === "interest_only"
  const revertsIn = status.monthsToRateEnd

  if (balance <= 0 || termMonths < 1) return null

  if (!flat && payment <= balance * monthlyRate(mortgage.interestRate)) {
    return (
      <Shell mortgage={mortgage} className={className}>
        <p className="text-[13px] font-medium text-destructive">
          {`The payment doesn't cover the interest, so the balance never falls.`}
        </p>
      </Shell>
    )
  }

  // Two walks of ~275 months. Left unmemoized on purpose: the React Compiler
  // handles it, and a manual useMemo defeats its analysis.
  const held = flat
    ? [balance, balance]
    : balanceSeries(balance, mortgage.interestRate, payment, termMonths)

  const compares =
    !flat && revertsIn !== null && revertsIn > 0 && revertsIn < termMonths
  const reverted = compares
    ? balanceSeriesWithReversion(
        balance,
        mortgage.interestRate,
        afterRate,
        payment,
        revertsIn,
        termMonths
      )
    : null

  const months = Math.max(held.length - 1, reverted ? reverted.length - 1 : 0)
  const { step, max: yMax } = niceScale(
    Math.max(balance, ...(reverted ?? [0]))
  )

  const x = (month: number) => PAD_L + (month / months) * PLOT_W
  const y = (pence: number) => BASE_Y - (pence / yMax) * PLOT_H

  const yTicks: number[] = []
  for (let value = 0; value <= yMax; value += step) yTicks.push(value)

  const heldEnd = held[held.length - 1]
  const revertedEnd = reverted?.[reverted.length - 1] ?? 0
  const termLabel = formatMonthYear(mortgage.termEndsOn)
  const markerX = compares && revertsIn !== null ? x(revertsIn) : null

  const sentence = compares
    ? `At ${mortgage.interestRate}% the balance reaches ${formatPenceShort(heldEnd)} by ${termLabel}; at ${afterRate}% on the same payment it reaches ${formatPenceShort(revertedEnd)}.`
    : `${formatPenceShort(balance)} owed today, reaching ${formatPenceShort(heldEnd)} by ${termLabel}.`

  return (
    <Shell
      mortgage={mortgage}
      className={className}
      action={
        compares ? (
          <RateControl value={afterRate} onChange={setAfterRate} />
        ) : undefined
      }
    >
      <div className="rounded-xl bg-muted/40 px-2.5 pt-3 pb-1.5">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={sentence}
        >
          <title>{sentence}</title>

          {yTicks.map((value) => (
            <g key={value}>
              <line
                x1={PAD_L}
                y1={px(y(value))}
                x2={VB_W - PAD_R}
                y2={px(y(value))}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                className="stroke-border/70"
              />
              <text
                x={PAD_L - 8}
                y={px(y(value)) + 4}
                textAnchor="end"
                fontSize={11}
                className="fill-muted-foreground/80 tabular-nums"
              >
                {axisPounds(value)}
              </text>
            </g>
          ))}

          <path
            d={`${linePath(held, x, y)} L${px(x(held.length - 1))} ${BASE_Y} L${PAD_L} ${BASE_Y} Z`}
            className="fill-emerald-500/[0.07]"
          />

          {reverted && (
            <path
              d={linePath(reverted, x, y)}
              fill="none"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="stroke-red-500"
            />
          )}

          <path
            d={linePath(held, x, y)}
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="stroke-emerald-500"
          />

          {markerX !== null && (
            <line
              x1={px(markerX)}
              y1={PAD_T}
              x2={px(markerX)}
              y2={BASE_Y}
              strokeWidth={1}
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
              className="stroke-amber-500/60"
            />
          )}

          <EndDot
            cx={px(x(held.length - 1))}
            cy={px(y(heldEnd))}
            className="stroke-emerald-500"
            tip={`${formatPenceShort(heldEnd)} left in ${termLabel}`}
          />
          {reverted && (
            <EndDot
              cx={px(x(reverted.length - 1))}
              cy={px(y(revertedEnd))}
              className="stroke-red-500"
              tip={`${formatPenceShort(revertedEnd)} left in ${termLabel}`}
            />
          )}

          <text
            x={PAD_L}
            y={VB_H - 6}
            fontSize={11}
            className="fill-muted-foreground/80 tabular-nums"
          >
            {now.getFullYear()}
          </text>
          <text
            x={VB_W - PAD_R}
            y={VB_H - 6}
            textAnchor="end"
            fontSize={11}
            className="fill-muted-foreground/80 tabular-nums"
          >
            {parseDay(mortgage.termEndsOn).getFullYear()}
          </text>
        </svg>
      </div>

      {/* Under the plot, outside its surface: names only. The figures live in
          the endpoint hovers, so the key stays one quiet line. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <Key swatch="line" className="bg-emerald-500">
          {`keeping ${mortgage.interestRate}%`}
        </Key>
        {reverted && (
          <Key swatch="line" className="bg-red-500">
            {`at ${afterRate}%`}
          </Key>
        )}
        {markerX !== null && mortgage.rateEndsOn && (
          <Key swatch="dash" className="border-amber-500">
            {`deal ends ${formatMonthYear(mortgage.rateEndsOn)}`}
          </Key>
        )}
      </div>
    </Shell>
  )
}

/**
 * A small visible dot over a large invisible hit area: 3px reads right at
 * this weight, but 3px is not a hover target, so the target is 22px.
 */
function EndDot({
  cx,
  cy,
  className,
  tip,
}: {
  cx: number
  cy: number
  className: string
  tip: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <g className="cursor-help">
            <circle cx={cx} cy={cy} r={14} fill="transparent" />
            <circle
              cx={cx}
              cy={cy}
              r={3.5}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              className={cn("fill-muted", className)}
            />
          </g>
        }
      />
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

/** The rate you land on if nothing is arranged. Stepped, not typed: this is
 *  a what-if, and a stepper keeps it one thumb away from a new answer. */
function RateControl({
  value,
  onChange,
}: {
  value: number
  onChange: (next: number) => void
}) {
  const set = (next: number) =>
    onChange(Math.min(15, Math.max(0.25, Number(next.toFixed(2)))))

  return (
    <span className="flex items-center gap-0.5 rounded-full border py-0.5 pr-0.5 pl-2.5 text-[11px] text-muted-foreground">
      after the deal
      <Button
        variant="ghost"
        size="icon-xs"
        className="rounded-full"
        aria-label="Lower the rate"
        onClick={() => set(value - 0.25)}
      >
        <Minus />
      </Button>
      <span className="w-10 text-center text-[12px] font-medium text-foreground tabular-nums">
        {`${value}%`}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        className="rounded-full"
        aria-label="Raise the rate"
        onClick={() => set(value + 0.25)}
      >
        <Plus />
      </Button>
    </span>
  )
}

function Key({
  swatch,
  className,
  children,
}: {
  swatch: "line" | "dash"
  className: string
  children: React.ReactNode
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn(
          "w-3 shrink-0",
          swatch === "line" ? "h-px rounded-full" : "border-t border-dashed",
          className
        )}
      />
      {children}
    </span>
  )
}

function Shell({
  mortgage,
  action,
  className,
  children,
}: {
  mortgage: Mortgage
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <ApexStatCard
      label="The road ahead"
      description={`Your balance at ${formatPence(mortgage.monthlyPayment)} a month`}
      icon={Route}
      iconClassName={ANCHOR_TINTS.balance}
      action={action}
      className={className}
    >
      {children}
    </ApexStatCard>
  )
}

function linePath(
  series: number[],
  x: (month: number) => number,
  y: (pence: number) => number
): string {
  return series
    .map(
      (value, month) =>
        `${month === 0 ? "M" : "L"}${px(x(month))} ${px(y(value))}`
    )
    .join(" ")
}

/** Zero up to the peak rounded to a clean step, aiming for three intervals. */
function niceScale(maxPence: number): { step: number; max: number } {
  const raw = Math.max(1, maxPence) / 3
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalized = raw / magnitude
  const nice =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10
  const step = nice * magnitude
  return { step, max: Math.ceil(maxPence / step) * step }
}

/** Axis short forms: 15,000,000p → "£150k". Labels only, never state. */
function axisPounds(pence: number): string {
  const pounds = pence / 100
  if (pounds >= 1_000_000) return `£${trimmed(pounds / 1_000_000)}m`
  if (pounds >= 1_000) return `£${trimmed(pounds / 1_000)}k`
  return `£${trimmed(pounds)}`
}

function trimmed(value: number): string {
  return String(Number(value.toFixed(2)))
}

/** One decimal keeps the server-rendered path short without visible loss */
function px(value: number): number {
  return Number(value.toFixed(1))
}

/**
 * The viewBox width is load-bearing and must stay near the rendered width.
 *
 * With `w-full`, the browser scales the whole coordinate space to fit the
 * container: a 560-wide box in a 1000px card multiplies every length by 1.8,
 * so 10px type renders at 18px and a 1.75px line at 3.1px. Sized against the
 * real width (1100px page cap, less card and surface padding) the scale is
 * ~1 and a stated size is the size you get. Strokes additionally carry
 * `vector-effect="non-scaling-stroke"`, which pins them to screen pixels at
 * any width, so only the geometry flexes on a narrow window.
 */
const VB_W = 1020
const VB_H = 175
const PAD_L = 52
const PAD_R = 16
const PAD_T = 12
const PAD_B = 26
const PLOT_W = VB_W - PAD_L - PAD_R
const PLOT_H = VB_H - PAD_T - PAD_B
const BASE_Y = VB_H - PAD_B
