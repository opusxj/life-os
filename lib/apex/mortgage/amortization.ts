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
 * A rate change already on the calendar: the deal ends on a known date and a
 * different rate runs from there to the term end.
 */
export type RateChange = {
  /** Months from now until the new rate starts */
  at: number
  /** The rate that applies from then on */
  ratePct: number
  /** Months from now to the contractual term end. The lender re-solves the
   *  payment against whatever is left of it. */
  termMonths: number
}

/**
 * Payoff and total interest under a payment, optionally carried through a rate
 * change that is already on the calendar.
 *
 * Two things the walk gets right that a single-rate simulation cannot. At the
 * switch the lender re-solves the contractual payment so the term still clears,
 * which is why holding one rate for twenty-five years on a deal with seven
 * months left reports a payoff that never happens. And the overpayment rides on
 * top of whatever the payment becomes, because an overpayment is a standing
 * instruction against the payment of the day, not a fixed total.
 */
function simulate(
  principal: number,
  annualRatePct: number,
  payment: number,
  extra: number,
  change?: RateChange
): PayoffProjection | null {
  if (principal <= 0) return { months: 0, totalInterest: 0 }

  let balance = principal
  let rate = monthlyRate(annualRatePct)
  let instalment = payment + extra
  let totalInterest = 0
  let months = 0
  // at <= 0 means the change has already happened, and the caller should have
  // passed the rate it landed on as annualRatePct
  const switchAt = change && change.at > 0 ? change.at : null

  while (balance > 0 && months < MAX_MONTHS) {
    if (switchAt !== null && change && months === switchAt) {
      const remaining = change.termMonths - switchAt
      if (remaining <= 0) return null
      instalment = monthlyPayment(balance, change.ratePct, remaining) + extra
      rate = monthlyRate(change.ratePct)
    }
    // Checked every month rather than once up front: a payment that covered
    // the interest at the old rate may not at the new one
    if (rate > 0 && instalment <= balance * rate) return null
    const interest = balance * rate
    totalInterest += interest
    balance = balance + interest - instalment
    months += 1
  }

  if (balance > 0) return null
  return { months, totalInterest: Math.round(totalInterest) }
}

/**
 * The overpayment what-if: baseline vs `payment + extraMonthly`, both from the
 * same walk so the two figures are directly comparable, and both through the
 * same rate change so neither is quoted against a rate that expires.
 */
export function overpaymentImpact(
  principal: number,
  annualRatePct: number,
  payment: number,
  extraMonthly: number,
  change?: RateChange
): OverpaymentImpact | null {
  const baseline = simulate(principal, annualRatePct, payment, 0, change)
  if (!baseline) return null
  const accelerated =
    extraMonthly > 0
      ? simulate(principal, annualRatePct, payment, extraMonthly, change)
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

export type InterestPath = {
  /** Interest paid in total by month n, pence. Index 0 is 0. */
  cumulative: number[]
  /** What the payment becomes once the new rate applies */
  paymentAfter: number
}

/**
 * Interest accumulating over the rest of the term, when the rate changes once
 * and the payment is recalculated to still clear the term.
 *
 * This is the honest model of what a lender does, and it is why a *balance*
 * chart cannot show what a rate costs: recalculating keeps every scenario
 * landing on zero at the term, so the whole difference moves into the payment
 * and the interest. Those are what this returns.
 */
export function cumulativeInterestPath(
  balance: number,
  ratePct: number,
  payment: number,
  changeAt: number,
  newRatePct: number,
  totalMonths: number
): InterestPath {
  const before = monthlyRate(ratePct)
  const cumulative = [0]
  let current = balance
  let paid = 0

  const held = Math.max(0, Math.min(changeAt, totalMonths))
  for (let month = 1; month <= held; month += 1) {
    const interest = current * before
    paid += interest
    current = current + interest - payment
    cumulative.push(Math.round(paid))
  }

  const remaining = totalMonths - held
  if (remaining <= 0 || current <= 0) {
    return { cumulative, paymentAfter: payment }
  }

  // The lender re-solves the payment so the term still ends on zero
  const paymentAfter = monthlyPayment(current, newRatePct, remaining)
  const after = monthlyRate(newRatePct)
  for (let month = 1; month <= remaining && current > 0; month += 1) {
    const interest = current * after
    paid += interest
    current = current + interest - paymentAfter
    cumulative.push(Math.round(paid))
  }

  return { cumulative, paymentAfter }
}

/**
 * A balance path where the rate changes once, `reversionAt` months in.
 *
 * The payment is held constant on purpose. A lender would recalculate it so
 * the term still clears, which is exactly why holding it still is the useful
 * comparison: it shows what the rate change costs, instead of hiding that
 * cost inside a new payment. Where the payment no longer covers the interest
 * the series rises, which is the honest outcome and not a bug.
 */
export function balanceSeriesWithReversion(
  principal: number,
  ratePct: number,
  reversionPct: number,
  payment: number,
  reversionAt: number,
  maxMonths: number
): number[] {
  const first = monthlyRate(ratePct)
  const second = monthlyRate(reversionPct)
  const series = [Math.max(0, principal)]
  let current = principal
  for (let month = 1; month <= maxMonths && current > 0; month += 1) {
    const r = month <= reversionAt ? first : second
    current = current + current * r - payment
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
 * Months of ordinary payments until the balance first falls to `target`.
 *
 * A lender's pricing band is a balance threshold, so the honest distance to one
 * is time and not only money: "£2,850 lower" is work, "by September 2027" is a
 * date you already have. 0 when the balance is already there; null when the
 * payment never gets there or the ceiling is hit first.
 *
 * Holds one rate for as long as it runs, so it is only safe where no rate
 * change is known to be coming. That is a real constraint and not a caveat:
 * this repo's demo row is fixed at 4.79% for seven more months and then reverts
 * to 6.99%, at which point the old payment stops covering the interest and the
 * balance turns and climbs, so anything walked past that date at the fixed rate
 * reports a threshold the loan never reaches. Callers with a deal end either
 * measure at it, as the Pricing band card does, or do not use this.
 */
export function monthsToBalance(
  balance: number,
  annualRatePct: number,
  payment: number,
  target: number
): number | null {
  if (balance <= target) return 0
  const r = monthlyRate(annualRatePct)
  if (r > 0 && payment <= balance * r) return null

  // Walks via stepBalance rather than a closed form, so a band date can never
  // disagree with the balance the charts draw for the same month.
  let current = balance
  for (let month = 1; month <= MAX_MONTHS; month += 1) {
    current = stepBalance(current, r, payment)
    if (current <= target) return month
  }
  return null
}

/**
 * The smallest monthly payment that brings `balance` down to `target` within
 * `months`, in pence. Null when there is no time to do it in, or when the
 * balance is already there.
 *
 * Closed form rather than a search: after n months a balance B at monthly rate
 * r under payment P stands at B(1+r)^n − P((1+r)^n − 1)/r, so solving that for
 * the P landing exactly on `target` gives the floor. Callers round up to a
 * figure someone would actually set up as a standing order.
 */
export function paymentToReach(
  balance: number,
  annualRatePct: number,
  months: number,
  target: number
): number | null {
  if (months <= 0 || balance <= target) return null
  const r = monthlyRate(annualRatePct)
  if (r === 0) return Math.ceil((balance - target) / months)
  const growth = (1 + r) ** months
  return Math.ceil(((balance * growth - target) * r) / (growth - 1))
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
