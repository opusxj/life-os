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

export type RepaymentType = "repayment" | "interest_only" | "part_and_part"

export type PaymentSplit = {
  /** Interest actually covered by this month's payment */
  interest: number
  /** The part of the payment that reduces the debt */
  capital: number
  /** Interest the payment doesn't cover; the balance grows by this */
  shortfall: number
}

/**
 * Where one month's payment goes. Lenders show the payment and they show the
 * balance, and never the line between them, which is the number that makes
 * overpaying make sense: early in a term most of a payment is rent on the debt
 * rather than repayment of it.
 */
export function paymentSplit(
  balance: number,
  annualRatePct: number,
  payment: number,
  repaymentType: RepaymentType = "repayment"
): PaymentSplit {
  const accrued = Math.round(balance * monthlyRate(annualRatePct))
  return {
    interest: Math.min(accrued, payment),
    // Interest-only pays the interest and nothing else, by construction
    capital:
      repaymentType === "interest_only" ? 0 : Math.max(0, payment - accrued),
    shortfall: Math.max(0, accrued - payment),
  }
}

/**
 * Age a known balance forward to today. A mortgage moves along a contractually
 * determined line, which makes projecting far more accurate than trusting a
 * stored figure: against a daily-rest schedule, five years of unattended
 * projection drifts ~£86 on a £200k mortgage, while a stored-and-unaged balance
 * is ~£9,000 out after two years. So we never ask for the balance twice.
 *
 * Interest-only does not amortise — the balance is the balance until the
 * capital falls due at term end.
 *
 * part_and_part is treated as repayment here, which understates the balance.
 * Modelling it properly needs the interest-only portion, which the entity
 * doesn't carry yet (docs/modules/apex/mortgage.md §2.1).
 */
export function projectBalance(
  balance: number,
  annualRatePct: number,
  payment: number,
  months: number,
  repaymentType: RepaymentType = "repayment"
): number {
  if (balance <= 0) return 0
  if (months <= 0 || repaymentType === "interest_only") return balance
  const r = monthlyRate(annualRatePct)
  let current = balance
  for (let index = 0; index < months && current > 0; index += 1) {
    current = stepBalance(current, r, payment)
  }
  return Math.max(0, Math.round(current))
}

/** One month of the contractual line: interest accrues, then the payment lands.
 *  The single definition of the step — everything that walks a balance forward
 *  (projectBalance, balanceSeries, and through them every card) goes via here,
 *  so no two surfaces can disagree about what a month does. */
function stepBalance(balance: number, r: number, payment: number): number {
  return balance + balance * r - payment
}

/**
 * The whole path, one entry per month: index 0 is the starting balance, index
 * n the balance after n payments, clamped at zero. Stops early once cleared.
 * Values are unrounded floats (round only at display) so threshold crossings
 * and chart geometry agree to the penny with projectBalance's arithmetic.
 */
export function balanceSeries(
  principal: number,
  annualRatePct: number,
  payment: number,
  maxMonths: number
): number[] {
  const r = monthlyRate(annualRatePct)
  const series = [Math.max(0, principal)]
  let current = principal
  for (let month = 1; month <= maxMonths && current > 0; month += 1) {
    current = stepBalance(current, r, payment)
    series.push(Math.max(0, current))
  }
  return series
}

/**
 * When more of a payment starts clearing debt than paying interest.
 *
 * Capital beats interest once `payment - B·r > B·r`, i.e. once the balance
 * falls below `payment / 2r`. Early in a long term that crossover is years
 * away and no lender shows it, which is exactly why it is worth a line: it
 * turns the split from a static ratio into something with a date on it.
 *
 * 0 when it has already happened; null when it never will (the payment does
 * not cover the interest, or the crossover sits beyond the ceiling).
 */
export function monthsToCapitalMajority(
  balance: number,
  annualRatePct: number,
  payment: number
): number | null {
  const r = monthlyRate(annualRatePct)
  if (r <= 0) return 0
  const target = payment / (2 * r)
  if (balance <= target) return 0
  if (payment <= balance * r) return null

  const series = balanceSeries(balance, annualRatePct, payment, MAX_MONTHS)
  const month = series.findIndex((value) => value <= target)
  return month === -1 ? null : month
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
