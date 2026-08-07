import { ChevronDown, Percent } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import {
  ApexStatCard,
  ApexStatFigure,
  ApexStatHint,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { parseDay } from "@/lib/apex/dates"
import { formatPenceShort } from "@/lib/apex/money"
import {
  monthsFromNow,
  monthsToBalance,
  paymentToReach,
  projectBalance,
  type RepaymentType,
} from "@/lib/apex/mortgage/amortization"
import type { Mortgage } from "@/lib/apex/mortgage/queries"
import {
  lendingBase,
  type LendingBase,
  type MortgageStatus,
} from "@/lib/apex/mortgage/status"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { formatMonthYear, formatShare } from "./format"

/**
 * The LTV thresholds UK lenders reprice at, best to worst. Below 60 there is
 * nothing left to improve into.
 *
 * A convention, not this lender's terms: nothing on the mortgage says which
 * thresholds Halifax or anyone else uses, and the app holds no rate for any of
 * them. So the copy hedges to "most lenders" wherever it makes the claim, and
 * nowhere on the card promises a saving it cannot size.
 */
const PRICING_BANDS = [60, 75, 80, 85, 90, 95]

/**
 * The order the steps are drawn in: dearest band first, so the staircase runs
 * the way everything else on the page is read. You stand at the left, where you
 * start, and the climb goes right toward cheaper rates.
 */
const STEPS = [...PRICING_BANDS].reverse()

/**
 * One height per step, rising left to right, so the tallest is the 60% band at
 * the far end and the shortest is the 95% band you are standing on.
 *
 * Height tracks how good a rung is, and that is the whole reason it is this way
 * round. Drawn with 95% tallest the reader stood on the summit, which reads as
 * an achievement however the labels are worded: "it's misleading given that we
 * are on the highest step which feels like that's a good thing, but it's not."
 * Now the shape says the same thing as the words beneath it.
 */
const STEP_HEIGHTS = [34, 47, 60, 73, 86, 100]

/** The staircase's own gap, in the two forms the marker maths needs. */
const STEP_GAP = "0.25rem"
const TOTAL_GAP = "1.25rem"

/**
 * The 10% norm on fixed deals, same hedge the Overpayment what-if card carries:
 * overpay more than this share of the balance in a year and most lenders charge
 * an early repayment charge. Above it, this card states the distance and stops
 * rather than proposing a payment that could cost money to make.
 */
const ALLOWANCE_PCT = 0.1

/**
 * What band will a lender price me in, and what would move me down one?
 *
 * A band is only ever used at one moment: when you remortgage. That is what
 * this card is anchored to, and it is what stopped the earlier version being
 * arbitrary. Six rungs measured against today's balance gave five thresholds
 * three to twelve years away and one that arrives by itself, none of which is a
 * decision. Measured at the deal end, the same ladder says something with a
 * deadline on it: what you will owe when a new lender looks, which side of the
 * nearest line that falls, and what closes the gap before then.
 *
 * Share-aware: lenders price a shared-ownership remortgage against the share,
 * not the whole property, so a 50% share makes £142,350 on £310,000 a 91.8%
 * loan and not the comfortable-looking 45.9% the full value would suggest.
 *
 * The rung labels are ceilings and not locations, which is the one thing the
 * card has to get across: 95% means "loans up to 95%", and a 91.8% loan stands
 * inside it. So the marker carries the figure and floats where it actually
 * falls, the ticks carry the percentage, and every rung names itself in pounds
 * on hover, where a percentage would only raise "of what?" again.
 */
export function LtvCard({
  mortgage,
  status,
  today,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  /** yyyy-mm-dd resolved server-side, the same clock status was computed on */
  today: string
  className?: string
}) {
  const lending = lendingBase(mortgage)

  if (lending === null) {
    return (
      <ApexStatCard
        label="Loan to value"
        description="No property value recorded"
        icon={Percent}
        iconClassName={ANCHOR_TINTS.property}
        className={className}
      >
        <ApexStatValue className="text-muted-foreground">—</ApexStatValue>
        <ApexStatHint className="mt-1.5">
          Edit the mortgage to add one and see where a lender would price you.
        </ApexStatHint>
      </ApexStatCard>
    )
  }

  // When the band actually gets used. With a deal still running that is the
  // day it ends; without one there is nothing to wait for, so it is now.
  const remortgageIn =
    status.monthsToRateEnd !== null && status.monthsToRateEnd > 0
      ? status.monthsToRateEnd
      : null
  const assessed =
    remortgageIn === null
      ? status.balanceToday
      : projectBalance(
          status.balanceToday,
          mortgage.interestRate,
          mortgage.monthlyPayment,
          remortgageIn,
          mortgage.repaymentType as RepaymentType
        )

  const ltvPct = (assessed / lending.value) * 100
  const ltvLabel = `${ltvPct.toFixed(1)}%`
  const underwater = assessed > lending.value
  const nextBand = underwater ? null : nextBandDown(assessed, lending.value)

  // Compared in pence rather than against the percentage, because nextBandDown
  // works in pence and a float comparison disagrees with it at equality: paying
  // exactly the distance the card asks for would otherwise land on a band the
  // card then refuses to award. Null above 95, outside every band on offer.
  const currentBand =
    PRICING_BANDS.find(
      (band) => assessed <= bandBalance(lending.value, band)
    ) ?? null

  const when =
    remortgageIn !== null && mortgage.rateEndsOn
      ? formatMonthYear(mortgage.rateEndsOn)
      : null

  return (
    <ApexStatCard
      label="Loan to value"
      description={baseDescription(lending)}
      icon={Percent}
      iconClassName={ANCHOR_TINTS.property}
      className={className}
    >
      {/* Lead with the gap you could close. The percentage is only how a band
          is measured, so it moves to the marker, where it labels a position
          instead of standing on its own as a score. */}
      {nextBand ? (
        <ApexStatValue>
          <ApexStatFigure>
            {formatPenceShort(nextBand.distance)}
          </ApexStatFigure>{" "}
          <ApexStatUnit>{`over the ${nextBand.band}% line`}</ApexStatUnit>
        </ApexStatValue>
      ) : (
        // No line left to cross, so the figure stands alone: the card's own
        // title already says what it is, and repeating "loan to value" under
        // it would be the label twice.
        <ApexStatValue>{ltvLabel}</ApexStatValue>
      )}

      {/* One marker, at the moment the band gets used. Two (today and the deal
          end) sat a point apart, overlapped, and asked the reader which one
          they were, which is the confusion this card exists to end. */}
      {/* h-11 is exactly what the stack inside measures (16 + 16 + 12), so the
          gap above the staircase is the number in the class rather than an
          overflow that happens to land right. */}
      <div aria-hidden className="relative mt-4 h-11">
        <span
          className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center text-indigo-600 dark:text-indigo-400"
          style={{ left: markerOffset(ltvPct) }}
        >
          <span className="text-[11px] leading-4 font-medium whitespace-nowrap tabular-nums">
            {ltvLabel}
          </span>
          <span className="text-[11px] leading-4 whitespace-nowrap text-muted-foreground">
            {when ?? "today"}
          </span>
          <ChevronDown className="size-3" />
        </span>
      </div>

      {/* Six products, six steps, each naming itself in pounds on hover. The
          percentage lives on the tick below; the pound figure is what answers
          "of what?", so between them a rung is fully defined. */}
      <div
        role="img"
        aria-label={stairLabel(ltvLabel, currentBand, lending, when)}
        className="flex h-11 w-full items-end gap-1"
      >
        {STEPS.map((band, index) => {
          const ceiling = bandBalance(lending.value, band)
          return (
            <Tooltip key={band}>
              <TooltipTrigger
                render={
                  <span
                    className={cn(
                      "flex-1 cursor-help rounded-t-md",
                      stepTint(
                        assessed - ceiling,
                        band === currentBand,
                        band === nextBand?.band
                      )
                    )}
                    style={{ height: `${STEP_HEIGHTS[index]}%` }}
                  />
                }
              />
              <TooltipContent>
                {stepTip(ceiling, assessed, band === currentBand)}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      <div
        aria-hidden
        className="mt-1.5 flex w-full gap-1 text-[11px] text-muted-foreground tabular-nums"
      >
        {STEPS.map((band) => (
          <span key={band} className="flex-1 text-center">
            {`${band}%`}
          </span>
        ))}
      </div>

      {/* Which end is which. The staircase's height already says it, and this
          says it again in words, because the one thing a reader must not get
          backwards is which direction is worth walking. The hedge on the claim
          itself lives in the sentence below, so these stay bare. */}
      <div
        aria-hidden
        className="mt-1 flex items-baseline justify-between text-[11px] text-muted-foreground"
      >
        <span>Higher rates</span>
        <span>Lower rates</span>
      </div>

      {/* The closing note, on the house hairline rather than floating loose
          under the graphic. mt-auto settles it at the card's base so this and
          its neighbours in the row end on one line however tall they grow. */}
      <div className="mt-auto pt-4">
        <p
          className={cn(
            "border-t pt-3 text-[12px] leading-snug text-muted-foreground",
            underwater && "font-medium text-destructive"
          )}
        >
          {underwater
            ? edgeVerdict(assessed, lending)
            : nextBand
              ? actionLine(
                  mortgage,
                  status,
                  nextBand,
                  remortgageIn,
                  when,
                  today
                )
              : "You are in the lowest pricing band lenders offer."}
        </p>
      </div>
    </ApexStatCard>
  )
}

/** Names the base so the figure can't be misread as whole-property LTV. */
function baseDescription(lending: LendingBase): string {
  return lending.shared
    ? `Against your ${formatShare(lending.share)}% share, worth ${formatPenceShort(lending.value)}`
    : `Against your ${formatPenceShort(lending.value)} property value`
}

/** The balance that would put this loan exactly on `band`, in pence. */
function bandBalance(base: number, band: number): number {
  return Math.round((base * band) / 100)
}

/**
 * The nearest band below the current position, worked in pence so the
 * distance shown is exactly the balance movement that reaches it. Null at or
 * below the lowest band.
 */
function nextBandDown(
  balance: number,
  base: number
): { band: number; balance: number; distance: number } | null {
  for (let index = PRICING_BANDS.length - 1; index >= 0; index -= 1) {
    const band = PRICING_BANDS[index]
    const target = bandBalance(base, band)
    if (balance > target) {
      return { band, balance: target, distance: balance - target }
    }
  }
  return null
}

/**
 * Where `ltvPct` falls along the staircase, as a CSS length.
 *
 * Reproduces the flex row's geometry rather than approximating it: six cells
 * sharing `100% - TOTAL_GAP`, each offset by one more STEP_GAP than the last.
 * Interpolating between rung centres keeps the marker honest about sitting
 * between two brackets, which is the whole point of showing it.
 */
function markerOffset(ltvPct: number): string {
  const rung = fractionalRung(ltvPct)
  const share = (rung / STEPS.length + 1 / (STEPS.length * 2)).toFixed(4)
  return `calc((100% - ${TOTAL_GAP}) * ${share} + ${STEP_GAP} * ${rung.toFixed(4)})`
}

/**
 * Where `ltvPct` sits in the drawn order, which runs 95% down to 60%. So 90.7
 * → 0.86: just past the 95% step, most of the way to the 90% one. Anything at
 * or above the dearest band pins to the first step, anything at or below the
 * cheapest to the last, since there is no rung beyond either end to travel to.
 */
function fractionalRung(ltvPct: number): number {
  const last = STEPS.length - 1
  if (ltvPct >= STEPS[0]) return 0
  if (ltvPct <= STEPS[last]) return last
  for (let index = 0; index < last; index += 1) {
    const dearer = STEPS[index]
    const cheaper = STEPS[index + 1]
    if (ltvPct >= cheaper) {
      return index + (dearer - ltvPct) / (dearer - cheaper)
    }
  }
  return last
}

/**
 * Three weights, because a step means one of three things: where the loan
 * would be priced, the one rung it is working toward, and the rungs beyond
 * that. Bands already beaten leave the indigo altogether, so the coloured run
 * is exactly the distance still to travel.
 */
function stepTint(distance: number, current: boolean, target: boolean): string {
  if (current) return "bg-indigo-500 dark:bg-indigo-400"
  if (target) return "bg-indigo-500/45 dark:bg-indigo-400/45"
  if (distance > 0) return "bg-indigo-500/20 dark:bg-indigo-400/20"
  return "bg-muted"
}

/**
 * A rung in pounds. "85%" invites "of what?", where "up to £131,750 borrowed"
 * cannot: it is the same threshold said in the units the balance is already in,
 * so the distance beneath it needs no explaining either.
 */
function stepTip(ceiling: number, assessed: number, current: boolean): string {
  const money = formatPenceShort(ceiling)
  if (current) return `Your band: loans up to ${money}`
  const distance = assessed - ceiling
  if (distance > 0) {
    return `Loans up to ${money}, ${formatPenceShort(distance)} below you`
  }
  return `Already under ${money}`
}

/** The staircase in words, for anyone who never sees the steps. */
function stairLabel(
  ltvLabel: string,
  currentBand: number | null,
  lending: LendingBase,
  when: string | null
): string {
  const moment = when ? `when your deal ends in ${when}` : `today`
  const position = currentBand
    ? `which is the band for loans up to ${currentBand}% of it`
    : `above every pricing band lenders offer`
  return `Your loan is ${ltvLabel} of the ${formatPenceShort(lending.value)} it is priced against ${moment}, ${position}. The steps are the bands lenders reprice at, from 60% to 95%.`
}

/**
 * What would move the loan down a band, and by when.
 *
 * States arithmetic, never a recommendation: whether £1,113 is better spent
 * here than anywhere else is the reader's call and the app has no view on it.
 * It also refuses to size the prize, because no rate for any band is recorded
 * anywhere, so "a band cheaper" is as far as the claim can honestly go.
 */
function actionLine(
  mortgage: Mortgage,
  status: MortgageStatus,
  nextBand: { band: number; balance: number },
  remortgageIn: number | null,
  when: string | null,
  today: string
): string {
  // Every branch ends the same way, because the promise is the same and it is
  // the one part of the sentence that has to stay hedged: the app holds no rate
  // for any band, so "charge less" is the whole of what it can claim.
  const tail = `where most lenders charge less`
  const bare = `Most lenders charge less under ${nextBand.band}%.`

  // No deal end on file means no date to aim at, so the useful fact is when
  // ordinary payments cross the line on their own. Safe to walk forward here
  // precisely because there is no known rate change ahead to invalidate it.
  if (remortgageIn === null || when === null) {
    if (status.lumpSumAtTerm) return bare
    const months = monthsToBalance(
      status.balanceToday,
      mortgage.interestRate,
      mortgage.monthlyPayment,
      nextBand.balance
    )
    if (months === null) return bare
    const on = formatMonthYear(monthsFromNow(months, parseDay(today)))
    return `Your payments get you under ${nextBand.band}% by ${on}, ${tail}.`
  }

  const needed = paymentToReach(
    status.balanceToday,
    mortgage.interestRate,
    remortgageIn,
    nextBand.balance
  )
  if (needed === null) return bare

  // Rounded up to whole pounds: a standing order is not set in pence, and
  // rounding up keeps the figure one that actually clears the line.
  const extra = Math.ceil((needed - mortgage.monthlyPayment) / 100) * 100
  if (extra <= 0) return bare

  // Above the early repayment allowance the figure stops being an option, so
  // the card states the threshold and says nothing it would have to caveat.
  if (extra * 12 > status.balanceToday * ALLOWANCE_PCT) return bare

  // The date lives on the marker, so the sentence names the event instead of
  // printing March 2027 twice.
  return `${formatPenceShort(extra)} a month extra gets you under ${nextBand.band}% before your deal ends, ${tail}.`
}

function edgeVerdict(balance: number, lending: LendingBase): string {
  const excess = formatPenceShort(balance - lending.value)
  return lending.shared
    ? `The loan is ${excess} larger than your share's value.`
    : `The loan is ${excess} larger than your property value.`
}
