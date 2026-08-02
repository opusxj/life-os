import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { todayKey } from "@/components/apex/due-state"
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
  const today = todayKey()
  const empty =
    data.accounts.length === 0 &&
    data.dueSoon.length === 0 &&
    data.topBudgets.length === 0 &&
    data.goals.length === 0 &&
    data.mortgages.length === 0

  // Third-row spans are computed from the data so a conditionally-null card
  // never leaves a hole: the row always sums to 3 at lg and 4 at 2xl.
  const goalCount = data.goals.length
  const hasMortgage = data.mortgages.length > 0
  const savingsClass = !hasMortgage
    ? "lg:col-span-3 2xl:col-span-4"
    : goalCount === 1
      ? undefined
      : goalCount === 2
        ? "lg:col-span-2"
        : "lg:col-span-2 2xl:col-span-3"
  const mortgageClass =
    goalCount === 0
      ? "lg:col-span-3 2xl:col-span-4"
      : goalCount === 1
        ? "lg:col-span-2 2xl:col-span-3"
        : goalCount === 2
          ? "2xl:col-span-2"
          : undefined

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
            nextUp={data.nextUp}
            payAccounts={data.payAccounts}
            today={today}
            className="2xl:col-span-2"
          />
          <CashflowCard months={data.cashflow} className="lg:col-span-2" />
          <MonthCard
            monthLabel={data.monthLabel}
            budgets={data.topBudgets}
            className="2xl:col-span-2"
          />
          <MortgageSnapshot
            mortgages={data.mortgages}
            className={mortgageClass}
          />
          <SavingsStrip
            goals={data.goals}
            accounts={data.goalAccounts}
            maxColumns={hasMortgage ? 3 : 4}
            className={savingsClass}
          />
        </div>
      )}
    </ApexPage>
  )
}
