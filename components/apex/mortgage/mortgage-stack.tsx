import { ApexCardGrid, ApexSection } from "@/components/apex/page"
import type { Mortgage } from "@/lib/apex/mortgage/queries"

import { BalanceCard } from "./balance-card"
import { MonthlyCostCard } from "./monthly-cost-card"
import { MortgageMenu } from "./mortgage-menu"
import { OwnershipCard } from "./ownership-card"
import { PayoffCard } from "./payoff-card"
import { RateCard } from "./rate-card"
import { WhatIfCard } from "./what-if-card"

/** One mortgage = one stack of isolated cards; each answers one question. */
export function MortgageStack({ mortgage }: { mortgage: Mortgage }) {
  return (
    <ApexSection
      label={`${mortgage.name} · ${mortgage.lender}`}
      action={<MortgageMenu mortgage={mortgage} />}
    >
      <ApexCardGrid>
        <BalanceCard mortgage={mortgage} />
        <RateCard mortgage={mortgage} />
        <MonthlyCostCard mortgage={mortgage} />
        <OwnershipCard mortgage={mortgage} />
        <PayoffCard mortgage={mortgage} />
        <WhatIfCard
          balance={mortgage.balance}
          interestRate={mortgage.interestRate}
          monthlyPayment={mortgage.monthlyPayment}
        />
      </ApexCardGrid>
    </ApexSection>
  )
}
