import { ApexSection } from "@/components/apex/page"
import type { Mortgage } from "@/lib/apex/mortgage/queries"

import { BalanceCard } from "./balance-card"
import { MortgageHeadlineCard } from "./headline-card"
import { MonthlyCostCard } from "./monthly-cost-card"
import { MortgageMenu } from "./mortgage-menu"
import { OwnershipCard } from "./ownership-card"
import { PayoffCard } from "./payoff-card"
import { RateCard } from "./rate-card"
import { WhatIfCard } from "./what-if-card"

/** One mortgage = one stack of isolated cards; each answers one question. */
export function MortgageStack({
  mortgage,
  today,
}: {
  mortgage: Mortgage
  /** yyyy-mm-dd, resolved server-side so SSR and hydration agree */
  today: string
}) {
  return (
    <ApexSection>
      {/* Zone 1 carries the mortgage's identity as well as its answer, so the
          name and its menu live in the card rather than in a label above it.
          The rest of the page is deliberately not its equal. */}
      <MortgageHeadlineCard
        mortgage={mortgage}
        today={today}
        action={<MortgageMenu mortgage={mortgage} />}
      />

      {/* Mortgage grid: Balance goes wide from xl, What-if from 2xl. Six
          cards land as two clean rows of four at 2xl; the fully-owned
          five-card stack fills 4 + 3 with no orphan row. */}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <BalanceCard mortgage={mortgage} className="xl:col-span-2" />
        <RateCard mortgage={mortgage} />
        <MonthlyCostCard mortgage={mortgage} />
        <OwnershipCard mortgage={mortgage} />
        <PayoffCard mortgage={mortgage} />
        <WhatIfCard
          balance={mortgage.balance}
          interestRate={mortgage.interestRate}
          monthlyPayment={mortgage.monthlyPayment}
          className="2xl:col-span-2"
        />
      </div>
    </ApexSection>
  )
}
