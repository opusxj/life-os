import type { Metadata } from "next"
import { redirect } from "next/navigation"

import {
  CashflowCard,
  DueSoonCard,
  MonthCard,
  MortgageSnapshot,
  OverviewEmpty,
  SavingsStrip,
  TotalBalanceCard,
} from "@/components/apex/overview/cards"
import { ApexPage, ApexPageHeader } from "@/components/apex/page"
import { getOverviewData } from "@/lib/apex/overview/queries"
import { getWorkspace } from "@/lib/data/workspace"

export const metadata: Metadata = { title: "Apex · Life OS" }

export default async function ApexOverviewPage() {
  const workspace = await getWorkspace()
  if (!workspace) redirect("/sign-in")

  const data = await getOverviewData(workspace.activeSpace.id)
  const empty =
    data.accounts.length === 0 &&
    data.dueSoon.length === 0 &&
    data.goals.length === 0 &&
    data.mortgages.length === 0

  return (
    <ApexPage>
      <ApexPageHeader title="Overview" />
      {empty ? (
        <OverviewEmpty />
      ) : (
        <div className="grid gap-3.5 lg:grid-cols-3 2xl:grid-cols-4">
          <TotalBalanceCard
            accounts={data.accounts}
            total={data.totalBalance}
            className="lg:col-span-2"
          />
          <DueSoonCard
            payments={data.dueSoon}
            payAccounts={data.payAccounts}
            className="2xl:col-span-2"
          />
          <CashflowCard months={data.cashflow} className="lg:col-span-2" />
          <MonthCard
            monthLabel={data.monthLabel}
            budgets={data.topBudgets}
            className="2xl:col-span-2"
          />
          <MortgageSnapshot mortgages={data.mortgages} />
          <SavingsStrip
            goals={data.goals}
            className="lg:col-span-2 2xl:col-span-3"
          />
        </div>
      )}
    </ApexPage>
  )
}
