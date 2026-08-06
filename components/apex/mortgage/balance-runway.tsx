import { Route } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { ApexStatCard } from "@/components/apex/stat-card"
import {
  balanceSeries,
  monthlyRate,
  monthsBetween,
  monthsFromNow,
  simulatePayoff,
} from "@/lib/apex/mortgage/amortization"
import { formatPenceShort } from "@/lib/apex/money"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatMonthYear } from "./format"

/**
 * The whole life of the debt in one picture: the balance from today, at the
 * current payment and rate, to zero or the term end. The legend rail beside
 * the plot names what the picture shows (today, the deal ending, where it
 * lands), so the chart carries no floating annotations: without the rail it
 * read as a pasted image whose marks meant nothing.
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
  const now = parseDay(today)
  const termMonths = monthsBetween(now, parseDay(mortgage.termEndsOn))

  // A cleared balance or an already-ended term leaves no road to draw
  if (status.balanceToday <= 0 || termMonths < 1) return null

  // A flat line is only honest for pure interest-only; part and part
  // amortises here exactly the way projectBalance does.
  const flat = mortgage.repaymentType === "interest_only"

  if (
    !flat &&
    simulatePayoff(
      status.balanceToday,
      mortgage.interestRate,
      mortgage.monthlyPayment
    ) === null
  ) {
    const coversInterest =
      mortgage.monthlyPayment >
      status.balanceToday * monthlyRate(mortgage.interestRate)
    return (
      <RunwayShell className={className}>
        <p className="text-[13px] font-medium text-destructive">
          {coversInterest
            ? `Payoff at this payment is more than a century away, so there is no road to draw.`
            : `The payment doesn't cover the interest, so the balance never falls.`}
        </p>
      </RunwayShell>
    )
  }

  const { points, months, remaining, cleared } = buildSeries(
    status.balanceToday,
    mortgage.interestRate,
    mortgage.monthlyPayment,
    termMonths,
    flat
  )

  const { step, max: yMax } = niceScale(status.balanceToday)
  const x = (month: number) => PAD_L + (month / months) * PLOT_W
  const y = (pence: number) => BASE_Y - (pence / yMax) * PLOT_H

  const yTicks: number[] = []
  for (let value = 0; value <= yMax; value += step) yTicks.push(value)

  const yearStep =
    YEAR_STEPS.find((years) => months / 12 / years <= 5) ?? YEAR_STEPS_MAX
  const xLabels: { x: number; year: number }[] = []
  for (let month = 0; month <= months; month += yearStep * 12) {
    xLabels.push({
      x: x(month),
      year: new Date(now.getFullYear(), now.getMonth() + month, 1).getFullYear(),
    })
  }

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${px(x(point.m))} ${px(y(point.v))}`
    )
    .join(" ")
  const areaPath = `${linePath} L${px(x(months))} ${BASE_Y} L${PAD_L} ${BASE_Y} Z`

  // The rate-end threshold, when it is still ahead and inside the domain.
  // Dashed is deliberate: it marks a boundary, unlike the solid gridlines.
  const marker =
    mortgage.rateEndsOn !== null &&
    status.monthsToRateEnd !== null &&
    status.monthsToRateEnd > 0 &&
    status.monthsToRateEnd < months
      ? { x: x(status.monthsToRateEnd), when: formatMonthYear(mortgage.rateEndsOn) }
      : null

  const termEndLabel = formatMonthYear(mortgage.termEndsOn)
  const endRow = flat
    ? { label: `Due ${termEndLabel}`, value: formatPenceShort(remaining) }
    : cleared
      ? { label: "Paid off", value: formatMonthYear(monthsFromNow(months, now)) }
      : {
          label: `At the ${termEndLabel} term end`,
          value: `${formatPenceShort(Math.round(remaining / 100) * 100)} still owed`,
        }

  const sentence = `${formatPenceShort(status.balanceToday)} owed today; ${
    cleared ? `paid off ${endRow.value}` : endRow.value
  }${marker ? `. The ${mortgage.interestRate}% rate ends ${marker.when}.` : "."}`

  return (
    <RunwayShell className={className}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {/* The rail is the legend: every mark in the plot has a named row */}
        <div className="flex shrink-0 flex-col gap-3.5 sm:w-44">
          <LegendRow swatch="dot" label="Today">
            {formatPenceShort(status.balanceToday)}
          </LegendRow>
          {marker && (
            <LegendRow swatch="dash" label="Deal ends">
              {marker.when}
            </LegendRow>
          )}
          <LegendRow swatch="ring" label={endRow.label}>
            {endRow.value}
          </LegendRow>
        </div>

        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-auto w-full min-w-0 flex-1"
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
                x={PAD_L - 7}
                y={px(y(value)) + 3}
                textAnchor="end"
                fontSize={10}
                className="fill-muted-foreground tabular-nums"
              >
                {axisPounds(value)}
              </text>
            </g>
          ))}

          {xLabels.map((label) => (
            <text
              key={label.year}
              x={px(label.x)}
              y={VB_H - 6}
              textAnchor="middle"
              fontSize={10}
              className="fill-muted-foreground tabular-nums"
            >
              {label.year}
            </text>
          ))}

          <path d={areaPath} className="fill-emerald-500/10" />
          <path
            d={linePath}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-emerald-500"
          />

          {marker && (
            <line
              x1={px(marker.x)}
              y1={PAD_T}
              x2={px(marker.x)}
              y2={BASE_Y}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              className="stroke-amber-500/70"
            />
          )}

          <circle
            cx={PAD_L + PLOT_W}
            cy={px(y(remaining))}
            r={4.5}
            strokeWidth={2}
            className="fill-emerald-500 stroke-card"
          />
        </svg>
      </div>
    </RunwayShell>
  )
}

/** One legend entry: the mark's swatch, what it is, and its value. */
function LegendRow({
  swatch,
  label,
  children,
}: {
  swatch: "dot" | "dash" | "ring"
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        aria-hidden
        className={cn(
          "mt-1 shrink-0",
          swatch === "dot" && "size-2.5 rounded-full bg-emerald-500",
          swatch === "ring" &&
            "size-2.5 rounded-full border-2 border-emerald-500",
          swatch === "dash" &&
            "h-0 w-3 translate-y-1 border-t-2 border-dashed border-amber-500"
        )}
      />
      <span className="min-w-0">
        <span className="block text-[12px] leading-snug text-muted-foreground">
          {label}
        </span>
        <span className="block text-sm font-medium tabular-nums">
          {children}
        </span>
      </span>
    </div>
  )
}

/** One header for every state, so the card reads the same even when empty. */
function RunwayShell({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <ApexStatCard
      label="The road ahead"
      description="Your balance from today at the current payment and rate"
      icon={Route}
      iconClassName={ANCHOR_TINTS.balance}
      className={className}
    >
      {children}
    </ApexStatCard>
  )
}

type SeriesPoint = { m: number; v: number }

/**
 * One point per month via the library's balanceSeries, so the chart, the
 * milestones, and projectBalance share a single definition of the monthly
 * step. Interest-only does not amortise, so its series is the flat truth:
 * two points at the same balance.
 */
function buildSeries(
  balance: number,
  annualRatePct: number,
  payment: number,
  termMonths: number,
  flat: boolean
): { points: SeriesPoint[]; months: number; remaining: number; cleared: boolean } {
  if (flat) {
    return {
      points: [
        { m: 0, v: balance },
        { m: termMonths, v: balance },
      ],
      months: termMonths,
      remaining: balance,
      cleared: false,
    }
  }
  const series = balanceSeries(balance, annualRatePct, payment, termMonths)
  const points = series.map((value, month) => ({ m: month, v: value }))
  const remaining = series[series.length - 1]
  return {
    points,
    months: series.length - 1,
    remaining,
    cleared: remaining <= 0,
  }
}

/**
 * Y domain: zero up to the balance rounded up to a clean step, aiming for
 * three or four intervals. £142,350 → £50,000 steps up to £150,000.
 */
function niceScale(maxPence: number): { step: number; max: number } {
  const raw = maxPence / 3
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalized = raw / magnitude
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10
  const step = nice * magnitude
  return { step, max: Math.ceil(maxPence / step) * step }
}

/** Axis short forms: 15,000,000p → "£150k", 0 → "£0". Labels only, never state. */
function axisPounds(pence: number): string {
  const pounds = pence / 100
  if (pounds >= 1_000_000) return `£${trimmed(pounds / 1_000_000)}m`
  if (pounds >= 1_000) return `£${trimmed(pounds / 1_000)}k`
  return `£${trimmed(pounds)}`
}

function trimmed(value: number): string {
  return String(Number(value.toFixed(2)))
}

/** One decimal place keeps the server-rendered path short without visible loss */
function px(value: number): number {
  return Number(value.toFixed(1))
}

/** yyyy-mm-dd → local midnight, matching status.ts month arithmetic */
function parseDay(key: string): Date {
  return new Date(`${key}T00:00:00`)
}

const VB_W = 560
const VB_H = 180
const PAD_L = 42
const PAD_R = 10
const PAD_T = 14
const PAD_B = 22
const PLOT_W = VB_W - PAD_L - PAD_R
const PLOT_H = VB_H - PAD_T - PAD_B
const BASE_Y = VB_H - PAD_B

/** Smallest year step that keeps the x axis at five labels or fewer */
const YEAR_STEPS = [1, 2, 5, 10, 25]
const YEAR_STEPS_MAX = 25
