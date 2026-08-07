"use client"

import * as React from "react"
import { Minus, Plus, Route } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { ApexStatCard } from "@/components/apex/stat-card"
import { Button } from "@/components/ui/button"
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
 * the deal ends and the rate reverts.
 *
 * The single-line version was a comfortable fiction. It projected today's
 * rate across the whole term when the rate is contractually guaranteed for a
 * handful of months, and on the seed mortgage 267 of 274 months were guessed.
 *
 * Both lines hold the payment constant, which is the whole point. A lender
 * recalculates the payment on reversion so the term still clears, so drawing
 * that would put both lines on top of each other and hide the cost in a
 * figure the chart doesn't show. Fixing the payment makes the cost visible:
 * where it stops covering the interest, the line climbs.
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

  // Interest-only never amortises, so a rate comparison would draw two flat
  // lines; a cleared balance or a finished term leaves no road at all.
  const flat = mortgage.repaymentType === "interest_only"
  const revertsIn = status.monthsToRateEnd

  // A cleared balance or a finished term leaves no road to draw
  if (balance <= 0 || termMonths < 1) return null

  // A payment already under the interest has no road: the line only rises,
  // and drawing that as a journey would dignify it.
  if (!flat && payment <= balance * monthlyRate(mortgage.interestRate)) {
    return (
      <Shell mortgage={mortgage} className={className}>
        <p className="text-[13px] font-medium text-destructive">
          {`The payment doesn't cover the interest, so the balance never falls.`}
        </p>
      </Shell>
    )
  }

  // Two walks of ~275 months each. Left unmemoized on purpose: the React
  // Compiler handles it, and a manual useMemo here defeats its analysis.
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
  const peak = Math.max(balance, ...(reverted ?? [0]))
  const { step, max: yMax } = niceScale(peak)

  const x = (month: number) => PAD_L + (month / months) * PLOT_W
  const y = (pence: number) => BASE_Y - (pence / yMax) * PLOT_H

  const yTicks: number[] = []
  for (let value = 0; value <= yMax; value += step) yTicks.push(value)

  const heldEnd = held[held.length - 1]
  const revertedEnd = reverted?.[reverted.length - 1] ?? 0
  const markerX =
    compares && revertsIn !== null ? x(revertsIn) : null

  const sentence = compares
    ? `At ${mortgage.interestRate}% the balance reaches ${formatPenceShort(heldEnd)} by ${formatMonthYear(mortgage.termEndsOn)}; at ${afterRate}% on the same payment it reaches ${formatPenceShort(revertedEnd)}.`
    : `${formatPenceShort(balance)} owed today, reaching ${formatPenceShort(heldEnd)} by ${formatMonthYear(mortgage.termEndsOn)}.`

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
      {/* The plot sits in its own inset surface so it reads as a panel of the
          card rather than marks floating in it. */}
      <div className="rounded-xl bg-muted/40 px-3 pt-3.5 pb-2.5">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-auto w-full"
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
                className="stroke-border"
              />
              <text
                x={PAD_L - 8}
                y={px(y(value)) + 4}
                textAnchor="end"
                fontSize={11}
                className="fill-muted-foreground tabular-nums"
              >
                {axisPounds(value)}
              </text>
            </g>
          ))}

          <path
            d={`${linePath(held, x, y)} L${px(x(held.length - 1))} ${BASE_Y} L${PAD_L} ${BASE_Y} Z`}
            className="fill-emerald-500/10"
          />

          {reverted && (
            <path
              d={linePath(reverted, x, y)}
              fill="none"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-red-500"
            />
          )}

          <path
            d={linePath(held, x, y)}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-emerald-500"
          />

          {markerX !== null && (
            <line
              x1={px(markerX)}
              y1={PAD_T}
              x2={px(markerX)}
              y2={BASE_Y}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              className="stroke-amber-500/70"
            />
          )}

          <circle
            cx={px(x(held.length - 1))}
            cy={px(y(heldEnd))}
            r={4.5}
            strokeWidth={2.5}
            className="fill-muted stroke-emerald-500"
          />
          {reverted && (
            <circle
              cx={px(x(reverted.length - 1))}
              cy={px(y(revertedEnd))}
              r={4.5}
              strokeWidth={2.5}
              className="fill-muted stroke-red-500"
            />
          )}

          <text
            x={PAD_L}
            y={VB_H - 6}
            fontSize={11}
            className="fill-muted-foreground tabular-nums"
          >
            {now.getFullYear()}
          </text>
          <text
            x={VB_W - PAD_R}
            y={VB_H - 6}
            textAnchor="end"
            fontSize={11}
            className="fill-muted-foreground tabular-nums"
          >
            {parseDay(mortgage.termEndsOn).getFullYear()}
          </text>
        </svg>

        {/* The key lives with the plot, naming every mark and its landing */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-2.5 text-[11px] text-muted-foreground">
          <Key swatch="line" className="bg-emerald-500">
            {`keeping ${mortgage.interestRate}% · ${formatPenceShort(heldEnd)} left`}
          </Key>
          {reverted && (
            <Key swatch="line" className="bg-red-500">
              {`at ${afterRate}% · ${formatPenceShort(revertedEnd)} left`}
            </Key>
          )}
          {markerX !== null && mortgage.rateEndsOn && (
            <Key swatch="dash" className="border-amber-500">
              {`deal ends ${formatMonthYear(mortgage.rateEndsOn)}`}
            </Key>
          )}
        </div>
      </div>

      {compares && (
        <p className="mt-4 border-t pt-3 text-[12px] leading-snug text-muted-foreground">
          {verdict(payment, revertedEnd, balance, afterRate)}
        </p>
      )}
    </Shell>
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
      <span className="w-11 text-center text-[13px] font-medium text-foreground tabular-nums">
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
          "w-3.5 shrink-0",
          swatch === "line" ? "h-0.5 rounded-full" : "border-t-2 border-dashed",
          className
        )}
      />
      {children}
    </span>
  )
}

/** The one conclusion, and it changes as the rate does. */
function verdict(
  payment: number,
  revertedEnd: number,
  balanceToday: number,
  afterRate: number
): string {
  const monthlyInterest = balanceToday * monthlyRate(afterRate)
  if (monthlyInterest >= payment) {
    return `At ${afterRate}% your payment stops covering the interest, so the balance climbs instead of falling.`
  }
  if (revertedEnd <= 0) {
    return `At ${afterRate}% the balance still clears before the term ends.`
  }
  return `At ${afterRate}% you would still owe ${formatPenceShort(revertedEnd)} when the term ends.`
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

const VB_W = 560
const VB_H = 168
const PAD_L = 46
const PAD_R = 12
const PAD_T = 14
const PAD_B = 24
const PLOT_W = VB_W - PAD_L - PAD_R
const PLOT_H = VB_H - PAD_T - PAD_B
const BASE_Y = VB_H - PAD_B
