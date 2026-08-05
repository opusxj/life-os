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

import { formatMonthYear } from "./format"

/**
 * The whole life of the debt in one picture: the balance from today, at the
 * current payment and rate, down to zero or to the end of the term, whichever
 * comes first. Interest-only draws the honest version, a flat line to the day
 * the capital falls due.
 *
 * Hand-rolled SVG on a fixed 720x240 viewBox so it stays a server component;
 * every projected point is derived here from the same status the other cards
 * share, never stored.
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

  // A flat line is only honest for pure interest-only. Part and part amortises
  // here exactly the way projectBalance does (understating, documented in
  // docs/modules/apex/mortgage.md §2.1), so the chart and the status agree.
  const flat = mortgage.repaymentType === "interest_only"

  // A payment under the interest has no runway at all: the line would only
  // rise, and drawing that as a road would dignify it. Say the right cause
  // plainly instead: simulatePayoff also bails past its century ceiling, and
  // that case is a long road rather than a broken one.
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

  // The rate-end threshold, when it is still ahead and lands inside the domain.
  // Dashed is deliberate here: it marks a boundary, unlike the solid gridlines.
  // The label rides at the top unless the line is up there too (a young
  // mortgage starts near the top of the scale), in which case it drops under
  // the curve, inside the area fill, where a falling line can't reach it.
  let rateMarker: {
    x: number
    flip: boolean
    labelY: number
    label: string
    aria: string
  } | null = null
  if (
    mortgage.rateEndsOn !== null &&
    status.monthsToRateEnd !== null &&
    status.monthsToRateEnd > 0 &&
    status.monthsToRateEnd < months
  ) {
    const lineY = y(points[Math.min(status.monthsToRateEnd, points.length - 1)].v)
    const topY = PAD_T + 10
    rateMarker = {
      x: x(status.monthsToRateEnd),
      flip: x(status.monthsToRateEnd) > PAD_L + PLOT_W * 0.65,
      labelY: lineY < topY + 12 ? Math.min(lineY + 16, BASE_Y - 6) : topY,
      label: `${mortgage.interestRate}% ends ${formatMonthYear(mortgage.rateEndsOn)}`,
      aria: `The ${mortgage.interestRate}% rate ends ${formatMonthYear(mortgage.rateEndsOn)}.`,
    }
  }

  const termEndLabel = formatMonthYear(mortgage.termEndsOn)
  const startLabel = formatPenceShort(status.balanceToday)
  const endX = PAD_L + PLOT_W
  const endY = y(remaining)
  // Above the dot when the line ends near the baseline, otherwise below it,
  // inside the area fill, where a falling line can never cross the text
  const endLabelY = endY <= BASE_Y - 26 ? endY + 14 : endY - 10

  let endLabel: string
  let sentence: string
  if (flat) {
    endLabel = `${startLabel} due ${termEndLabel}`
    sentence = `${startLabel} owed today, due in full at the ${termEndLabel} term end.`
  } else if (cleared) {
    const paidOff = formatMonthYear(monthsFromNow(months, now))
    endLabel = `Paid off ${paidOff}`
    sentence = `${startLabel} owed today, paid off by ${paidOff} at the current payment and rate.`
  } else {
    const owed = formatPenceShort(Math.round(remaining / 100) * 100)
    endLabel = `${owed} still owed at ${termEndLabel}`
    sentence = `${startLabel} owed today falls to ${owed} by the ${termEndLabel} term end at the current payment and rate.`
  }
  if (rateMarker) sentence += ` ${rateMarker.aria}`

  return (
    <RunwayShell className={className}>
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
            y={VB_H - 8}
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
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-emerald-500"
        />

        {rateMarker && (
          <g>
            <line
              x1={px(rateMarker.x)}
              y1={PAD_T}
              x2={px(rateMarker.x)}
              y2={BASE_Y}
              strokeWidth={1}
              strokeDasharray="4 4"
              className="stroke-amber-500/70"
            />
            <text
              x={px(rateMarker.x + (rateMarker.flip ? -5 : 5))}
              y={px(rateMarker.labelY)}
              textAnchor={rateMarker.flip ? "end" : "start"}
              fontSize={10}
              className="fill-muted-foreground"
            >
              {rateMarker.label}
            </text>
          </g>
        )}

        <circle
          cx={endX}
          cy={px(endY)}
          r={4}
          strokeWidth={2}
          className="fill-emerald-500 stroke-card"
        />
        <text
          x={endX}
          y={px(endLabelY)}
          textAnchor="end"
          fontSize={10}
          className="fill-muted-foreground tabular-nums"
        >
          {endLabel}
        </text>
      </svg>
    </RunwayShell>
  )
}

/** One header for every state, so the card reads the same even when empty.
 *  Built on ApexStatCard so the chart panel carries the page's anchor grammar
 *  (icon chip, provenance line) like every other card. */
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

const VB_W = 720
const VB_H = 240
const PAD_L = 48
const PAD_R = 16
const PAD_T = 16
const PAD_B = 26
const PLOT_W = VB_W - PAD_L - PAD_R
const PLOT_H = VB_H - PAD_T - PAD_B
const BASE_Y = VB_H - PAD_B

/** Smallest year step that keeps the x axis at five labels or fewer */
const YEAR_STEPS = [1, 2, 5, 10, 25]
const YEAR_STEPS_MAX = 25
