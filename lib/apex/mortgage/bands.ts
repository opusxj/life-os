// Lender LTV pricing bands. Shared because two cards now reason about them —
// Loan to value draws the ladder, Overpaying offers "the amount that reaches
// the next one" as a preset — and a band the two disagreed about would be
// worse than either card not having it.

/**
 * The LTV thresholds UK lenders reprice at, best to worst. Below 60 there is
 * nothing left to improve into.
 *
 * A convention, not any particular lender's terms: nothing on a mortgage says
 * which thresholds its lender uses, and the app holds no rate for any of them.
 * Copy built on these hedges to "most lenders", and never sizes the saving.
 */
export const PRICING_BANDS = [60, 75, 80, 85, 90, 95]

/** The balance that would put a loan exactly on `band`, in pence. */
export function bandBalance(base: number, band: number): number {
  return Math.round((base * band) / 100)
}

/**
 * The band a loan is priced in: the smallest rung its balance still fits under.
 * Null above the highest band, where the loan is outside every one on offer.
 *
 * Compared in pence rather than against a percentage, because `nextBandDown`
 * works in pence and a float comparison disagrees with it at equality — paying
 * exactly the distance a card asks for would otherwise land on a band the card
 * then refuses to award.
 */
export function bandFor(balance: number, base: number): number | null {
  return PRICING_BANDS.find((band) => balance <= bandBalance(base, band)) ?? null
}

export type NextBand = {
  band: number
  /** The balance that reaches it, pence */
  balance: number
  /** How far the current balance is above that, pence */
  distance: number
}

/**
 * The nearest band below the current position, worked in pence so the distance
 * is exactly the balance movement that reaches it. Null at or below the lowest.
 */
export function nextBandDown(balance: number, base: number): NextBand | null {
  for (let index = PRICING_BANDS.length - 1; index >= 0; index -= 1) {
    const band = PRICING_BANDS[index]
    const target = bandBalance(base, band)
    if (balance > target) {
      return { band, balance: target, distance: balance - target }
    }
  }
  return null
}
