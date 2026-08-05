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
    <ApexSection
      label={`${mortgage.name} · ${mortgage.lender}`}
      action={<MortgageMenu mortgage={mortgage} />}
    >
      {/* Zone 1: the page's one answer, above the grid and outside it — the
          hierarchy is deliberate, the rest of the page is not its equal. */}
      <MortgageHeadlineCard mortgage={mortgage} today={today} />

      {/* Mortgage grid: Balance goes wide from xl, What-if from 2xl — six
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
