// Pure amortization math for the Mortgage cards (LIFE-29). All money values
// are integer pence in and out; the simulation runs in floats and rounds only
// at the boundary. Projections are derived, never stored (apex.md decision #10).

export type PayoffProjection = {
  /** Whole months until the balance clears (the final partial month counts) */
  months: number
  /** Total interest paid across those months, pence */
  totalInterest: number
}

export type OverpaymentImpact = {
  baseline: PayoffProjection
  accelerated: PayoffProjection
  monthsSaved: number
  interestSaved: number
}

/** Projections longer than a century mean the inputs are nonsense — bail. */
const MAX_MONTHS = 1200

/** 4.79 (% per year) → 0.00399… (fraction per month) */
export function monthlyRate(annualRatePct: number): number {
  return annualRatePct / 100 / 12
}

/** Standard repayment payment (pence) to clear `principal` over `months`. */
export function monthlyPayment(
  principal: number,
  annualRatePct: number,
  months: number
): number {
  if (months <= 0) return principal
  const r = monthlyRate(annualRatePct)
  if (r === 0) return Math.ceil(principal / months)
  return Math.round((principal * r) / (1 - (1 + r) ** -months))
}

/**
 * Closed-form months to repay: -ln(1 - r·P/pmt) / ln(1+r), rounded up.
 * Null when the payment doesn't cover the interest — the loan never shrinks.
 */
export function monthsToRepay(
  principal: number,
  annualRatePct: number,
  payment: number
): number | null {
  if (principal <= 0) return 0
  if (payment <= 0) return null
  const r = monthlyRate(annualRatePct)
  if (r === 0) return Math.ceil(principal / payment)
  if (payment <= principal * r) return null
  return Math.ceil(-Math.log(1 - (r * principal) / payment) / Math.log(1 + r))
}

/**
 * Month-by-month simulation: interest accrues on the balance, the payment
 * lands, repeat until cleared — exact about the final partial month.
 * Null when the payment doesn't cover the interest or payoff would take
 * longer than MAX_MONTHS.
 */
export function simulatePayoff(
  principal: number,
  annualRatePct: number,
  payment: number
): PayoffProjection | null {
  if (principal <= 0) return { months: 0, totalInterest: 0 }
  if (payment <= 0) return null
  const r = monthlyRate(annualRatePct)
  if (r > 0 && payment <= principal * r) return null

  let balance = principal
  let totalInterest = 0
  let months = 0
  while (balance > 0 && months < MAX_MONTHS) {
    const interest = balance * r
    totalInterest += interest
    balance = balance + interest - payment
    months += 1
  }
  if (balance > 0) return null
  return { months, totalInterest: Math.round(totalInterest) }
}

/**
 * The overpayment what-if: baseline vs `payment + extraMonthly`, both from
 * the simulation so the two figures are directly comparable.
 */
export function overpaymentImpact(
  principal: number,
  annualRatePct: number,
  payment: number,
  extraMonthly: number
): OverpaymentImpact | null {
  const baseline = simulatePayoff(principal, annualRatePct, payment)
  if (!baseline) return null
  const accelerated =
    extraMonthly > 0
      ? simulatePayoff(principal, annualRatePct, payment + extraMonthly)
      : baseline
  if (!accelerated) return null
  return {
    baseline,
    accelerated,
    monthsSaved: baseline.months - accelerated.months,
    interestSaved: Math.max(
      0,
      baseline.totalInterest - accelerated.totalInterest
    ),
  }
}

/**
 * Calendar month `months` from `from` (defaults to now), pinned to the 1st —
 * payoff dates are displayed at month precision, so the day never matters.
 */
export function monthsFromNow(months: number, from = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() + months, 1)
}

/** Whole calendar months from `a` to `b`; negative when `b` is earlier. */
export function monthsBetween(a: Date, b: Date): number {
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  )
}
