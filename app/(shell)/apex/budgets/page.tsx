import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PiggyBank, PieChart } from "lucide-react"

import {
  ApexCardGrid,
  ApexPage,
  ApexPageHeader,
  ApexSection,
} from "@/components/apex/page"
import { BudgetRow } from "@/components/apex/budgets/budget-row"
import { GoalCard } from "@/components/apex/budgets/goal-card"
import { NewGoalButton } from "@/components/apex/budgets/goal-drawer"
import { NewBudgetDialog } from "@/components/apex/budgets/new-budget-dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getBudgetsPageData } from "@/lib/apex/budgets/queries"
import { getWorkspace } from "@/lib/data/workspace"

export const metadata: Metadata = {
  title: "Budgets & Savings · Apex · Life OS",
}

export default async function BudgetsPage() {
  const workspace = await getWorkspace()
  if (!workspace) redirect("/sign-in")

  const data = await getBudgetsPageData(workspace.activeSpace.id)

  return (
    <ApexPage>
      <ApexPageHeader title="Budgets & Savings" />

      <ApexSection
        label={`Budgets · ${data.monthLabel}`}
        action={<NewBudgetDialog categories={data.budgetableCategories} />}
      >
        {data.budgets.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PieChart />
              </EmptyMedia>
              <EmptyTitle>No budgets yet</EmptyTitle>
              <EmptyDescription>
                Give a category a monthly envelope and watch the bar.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-2">
            {data.budgets.map((budget) => (
              <BudgetRow key={budget.id} budget={budget} />
            ))}
          </div>
        )}
      </ApexSection>

      <ApexSection
        label="Saving goals"
        action={<NewGoalButton savingsAccounts={data.savingsAccounts} />}
      >
        {data.goals.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PiggyBank />
              </EmptyMedia>
              <EmptyTitle>No saving goals yet</EmptyTitle>
              <EmptyDescription>
                Name the thing, set a target, fill the grid.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ApexCardGrid>
            {data.goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                accounts={data.accounts}
                savingsAccounts={data.savingsAccounts}
              />
            ))}
          </ApexCardGrid>
        )}
      </ApexSection>
    </ApexPage>
  )
}
