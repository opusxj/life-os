import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { mortgageStatus } from "@/lib/apex/mortgage/status"

import { BalanceCard } from "./balance-card"
import { BalanceRunway } from "./balance-runway"
import { EquityCard } from "./equity-card"
import { MortgageHeadlineCard } from "./headline-card"
import { LtvCard } from "./ltv-card"
import { MilestonesCard } from "./milestones-card"
import { MonthlyCostCard } from "./monthly-cost-card"
import { MortgageMenu } from "./mortgage-menu"
import { PaperworkCard } from "./paperwork-card"
import { PayoffCard } from "./payoff-card"
import { ThisMonthCard } from "./this-month-card"
import { TrueCostCard } from "./true-cost-card"
import { WhatIfCard } from "./what-if-card"

/**
 * One mortgage = one stack of isolated cards, each answering one question,
 * read in the order the questions occur to someone: the deal, where you
 * stand, the whole road, the asset, what you can do, the record. Cards that
 * lack their data (LTV, equity, milestones) prompt once or step aside; the
 * stack never renders a broken half-answer.
 */
export function MortgageStack({
  mortgage,
  today,
  cardBalanceAction,
}: {
  mortgage: Mortgage
  /** yyyy-mm-dd, resolved server-side so SSR and hydration agree */
  today: string
  /** Balance card carries its own Update balance only when the page bar can't */
  cardBalanceAction?: boolean
}) {
  // Resolved once and shared, so no two cards can disagree about the balance
  const status = mortgageStatus(mortgage, today)

  return (
    <section className="space-y-4">
      {/* The deal, and nothing that appears below it. The rate and its end
          date live in the subtitle rather than in a card of their own, so the
          top of the page states each fact exactly once. */}
      <MortgageHeadlineCard
        mortgage={mortgage}
        today={today}
        action={<MortgageMenu mortgage={mortgage} />}
      />

      {/* Where you stand: the balance, where this month's money goes, the end */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BalanceCard
          mortgage={mortgage}
          status={status}
          today={today}
          quickAction={cardBalanceAction}
        />
        <ThisMonthCard mortgage={mortgage} status={status} today={today} />
        <PayoffCard mortgage={mortgage} status={status} today={today} />
      </div>

      {/* The whole road, one picture */}
      <BalanceRunway mortgage={mortgage} status={status} today={today} />

      {/* The asset: what the debt is secured on and what that's worth to you */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LtvCard mortgage={mortgage} status={status} />
        <EquityCard mortgage={mortgage} status={status} />
        <TrueCostCard mortgage={mortgage} status={status} today={today} />
      </div>

      {/* What you can do about it, and what happens next if you don't */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <WhatIfCard
          balance={status.balanceToday}
          interestRate={mortgage.interestRate}
          monthlyPayment={mortgage.monthlyPayment}
          today={today}
          className="sm:col-span-2"
        />
        <MilestonesCard mortgage={mortgage} status={status} today={today} />
      </div>

      {/* The record: running costs and the terms on file */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MonthlyCostCard mortgage={mortgage} />
        <PaperworkCard
          mortgage={mortgage}
          status={status}
          className="lg:col-span-2"
        />
      </div>
    </section>
  )
}
