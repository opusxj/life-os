import type { Mortgage } from "@/lib/apex/mortgage/queries"
import { mortgageStatus } from "@/lib/apex/mortgage/status"

import { BalanceCard } from "./balance-card"
import { CostAheadCard } from "./cost-ahead-card"
import { EquityCard } from "./equity-card"
import { MortgageHeadlineCard } from "./headline-card"
import { LtvCard } from "./ltv-card"
import { MilestonesCard } from "./milestones-card"
import { MonthlyCostCard } from "./monthly-cost-card"
import { MortgageMenu } from "./mortgage-menu"
import { PaperworkCard } from "./paperwork-card"
import { PayoffCard } from "./payoff-card"
import { RentCard } from "./rent-card"
import { ThisMonthCard } from "./this-month-card"
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

      {/* Where you stand, in time order: this month's payment, the balance it
          leaves, the date it all ends. The balance sits between them because
          it is the fact the other two are measured against, and its arc gives
          the row a centre. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ThisMonthCard mortgage={mortgage} status={status} today={today} />
        <BalanceCard
          mortgage={mortgage}
          status={status}
          today={today}
          quickAction={cardBalanceAction}
        />
        <PayoffCard mortgage={mortgage} status={status} today={today} />
      </div>

      {/* What the rest of it costs, and what the next rate does to that */}
      <CostAheadCard mortgage={mortgage} status={status} today={today} />

      {/* The asset, read outward from the debt: what the loan measures against
          the share you own and what the next remortgage prices that at, then
          the part of the share already yours, then the part that was never
          yours and charges rent for it. Equity and rent step aside when the
          valuation or the rent isn't recorded rather than render an empty
          card. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LtvCard mortgage={mortgage} status={status} today={today} />
        <EquityCard mortgage={mortgage} status={status} />
        <RentCard mortgage={mortgage} status={status} />
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
