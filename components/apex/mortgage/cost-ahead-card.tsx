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
  cumulativeInterestPath,
  monthsBetween,
} from "@/lib/apex/mortgage/amortization"
import { formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatMonthYear } from "./format"

/**
 * What the rest of this mortgage costs in interest, and what the rate you
 * land on after the deal does to that.
 *
 * This card used to plot the balance, which could not answer the question it
 * was asked. A lender re-solves the payment whenever the rate changes so the
 * term still ends on zero, which means every rate draws the same balance line
 * and the whole difference hides in the payment. Interest is where the
 * difference actually lives, so interest is what gets drawn.
 *
 * A cumulative curve also reads at any point, not just its end: run your eye
 * to a year and you have what you will have paid by then.
 */
export function CostAheadCard({
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
  const balance = status.balanceToday

  if (balance <= 0 || termMonths < 2) return null

  const changesIn = status.monthsToRateEnd
  const compares =
    !status.lumpSumAtTerm &&
    changesIn !== null &&
    changesIn > 0 &&
    changesIn < termMonths

  // The baseline is always "today's rate simply continues". Without a deal
  // end there is nothing to compare it against, so the card draws one line.
  const held = cumulativeInterestPath(
    balance,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    compares ? (changesIn as number) : termMonths,
    mortgage.interestRate,
    termMonths
  )
  const scenario = compares
    ? cumulativeInterestPath(
        balance,
        mortgage.interestRate,
        mortgage.monthlyPayment,
        changesIn as number,
        afterRate,
        termMonths
      )
    : null

  const months = held.cumulative.length - 1
  const heldTotal = held.cumulative[months]
  const scenarioTotal = scenario?.cumulative[scenario.cumulative.length - 1] ?? 0
  const { step, max: yMax } = niceScale(Math.max(heldTotal, scenarioTotal))

  const x = (month: number) => PAD_L + (month / months) * PLOT_W
  const y = (pence: number) => BASE_Y - (pence / yMax) * PLOT_H

  const yTicks: number[] = []
  for (let value = 0; value <= yMax; value += step) yTicks.push(value)

  const termLabel = formatMonthYear(mortgage.termEndsOn)
  const markerX = compares ? x(changesIn as number) : null
  const gap = scenarioTotal - heldTotal
  const paymentGap = scenario
    ? scenario.paymentAfter - held.paymentAfter
    : 0

  const sentence = compares
    ? `Keeping ${mortgage.interestRate}% costs ${formatPenceShort(heldTotal)} in interest by ${termLabel}; at ${afterRate}% it is ${formatPenceShort(scenarioTotal)}.`
    : `${formatPenceShort(heldTotal)} of interest between now and ${termLabel}.`

  return (
    <ApexStatCard
      label="The cost ahead"
      description="Interest you will have paid, by year"
      icon={Route}
      iconClassName={ANCHOR_TINTS.bill}
      className={className}
      action={
        compares ? (
          <RateControl value={afterRate} onChange={setAfterRate} />
        ) : undefined
      }
    >
      <div className="mt-1">
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
                fontSize={12}
                className="fill-muted-foreground tabular-nums"
              >
                {axisPounds(value)}
              </text>
            </g>
          ))}

          {/* The ground under the baseline, then the band between the two
              curves. That band is not decoration: its area is the gap the
              footer states, so the extra cost is a shape as well as a
              number. */}
          <path
            d={`${linePath(held.cumulative, x, y)} L${px(x(months))} ${BASE_Y} L${PAD_L} ${BASE_Y} Z`}
            className="fill-foreground/[0.05]"
          />
          {scenario && (
            <path
              d={bandPath(scenario.cumulative, held.cumulative, x, y)}
              className={
                gap < 0 ? "fill-emerald-500/[0.12]" : "fill-red-500/[0.12]"
              }
            />
          )}

          {scenario && (
            <path
              d={linePath(scenario.cumulative, x, y)}
              fill="none"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className={gap < 0 ? "stroke-emerald-500" : "stroke-red-500"}
            />
          )}

          <path
            d={linePath(held.cumulative, x, y)}
            fill="none"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={cn(
              scenario ? "stroke-foreground/40" : "stroke-emerald-500"
            )}
          />

          {markerX !== null && mortgage.rateEndsOn && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <g className="cursor-help">
                    {/* A 1px line is not a hover target; this is */}
                    <rect
                      x={px(markerX - 10)}
                      y={PAD_T}
                      width={20}
                      height={BASE_Y - PAD_T}
                      fill="transparent"
                    />
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
                  </g>
                }
              />
              <TooltipContent>
                {`Deal ends ${formatMonthYear(mortgage.rateEndsOn)}`}
              </TooltipContent>
            </Tooltip>
          )}

          <EndDot
            cx={px(x(months))}
            cy={px(y(heldTotal))}
            className={cn(
              scenario ? "stroke-foreground/40" : "stroke-emerald-500"
            )}
            tip={`${formatPenceShort(heldTotal)} interest by ${termLabel}`}
          />
          {scenario && (
            <EndDot
              cx={px(x(scenario.cumulative.length - 1))}
              cy={px(y(scenarioTotal))}
              className={gap < 0 ? "stroke-emerald-500" : "stroke-red-500"}
              tip={`${formatPenceShort(scenarioTotal)} interest by ${termLabel}`}
            />
          )}

          <text
            x={PAD_L}
            y={VB_H - 8}
            fontSize={12}
            className="fill-muted-foreground tabular-nums"
          >
            {now.getFullYear()}
          </text>
          <text
            x={VB_W - PAD_R}
            y={VB_H - 6}
            textAnchor="end"
            fontSize={12}
            className="fill-muted-foreground tabular-nums"
          >
            {parseDay(mortgage.termEndsOn).getFullYear()}
          </text>
        </svg>
      </div>

      {/* Identification only. The figures are one hover away on the marks
          themselves, and the consequences are the footer's job. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground">
        <Key
          swatch="line"
          className={scenario ? "bg-foreground/40" : "bg-emerald-500"}
        >
          {`${mortgage.interestRate}% today`}
        </Key>
        {scenario && (
          <Key
            swatch="line"
            className={gap < 0 ? "bg-emerald-500" : "bg-red-500"}
          >
            {`${afterRate}% after`}
          </Key>
        )}
        {markerX !== null && (
          <Key swatch="dash" className="border-amber-500">
            deal ends
          </Key>
        )}
      </div>

      {compares && gap !== 0 && (
        <div className="mt-auto pt-4">
          <p className="border-t pt-3 text-[12px] leading-snug text-muted-foreground">
            <span
              className={cn(
                "font-medium",
                gap > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {formatPenceShort(Math.abs(gap))}
            </span>
            {gap > 0 ? " more interest" : " less interest"}
            {paymentGap === 0
              ? " than if today's rate carried on."
              : `, and ${formatPenceShort(Math.abs(paymentGap))} a month ${paymentGap > 0 ? "more" : "less"} to pay.`}
          </p>
        </div>
      )}
    </ApexStatCard>
  )
}

/** A small visible dot over a large invisible hit area: 3.5px reads right at
 *  this weight, but 3.5px is not a hover target. */
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
              className={cn("fill-card", className)}
            />
          </g>
        }
      />
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  )
}

/** The rate you land on when the deal ends. Stepped, not typed: this is a
 *  what-if, and a stepper keeps it one thumb away from a new answer. */
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

/** The closed region between two curves: out along one, back along the other. */
function bandPath(
  upper: number[],
  lower: number[],
  x: (month: number) => number,
  y: (pence: number) => number
): string {
  const back = lower
    .map((value, month) => `L${px(x(month))} ${px(y(value))}`)
    .reverse()
    .join(" ")
  return `${linePath(upper, x, y)} ${back} Z`
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

function px(value: number): number {
  return Number(value.toFixed(1))
}

/** The viewBox width stays near the rendered width so a stated size is the
 *  size you get; strokes additionally pin to screen pixels at any width. */
const VB_W = 1020
const VB_H = 190
const PAD_L = 58
const PAD_R = 16
const PAD_T = 14
/** Deep enough that the year labels clear the £0 tick sitting on the
 *  baseline; at 26 the two crowded each other in the corner. */
const PAD_B = 38
const PLOT_W = VB_W - PAD_L - PAD_R
const PLOT_H = VB_H - PAD_T - PAD_B
const BASE_Y = VB_H - PAD_B
