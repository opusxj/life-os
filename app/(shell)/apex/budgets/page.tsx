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
import { formatPenceShort } from "@/components/apex/budgets/format"
import { GoalCard } from "@/components/apex/budgets/goal-card"
import { NewGoalButton } from "@/components/apex/budgets/goal-drawer"
import { NewBudgetDialog } from "@/components/apex/budgets/new-budget-dialog"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getBudgetsPageData } from "@/lib/apex/budgets/queries"
import { getWorkspace } from "@/lib/data/workspace"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Budgets & Savings · Apex · Life OS",
}

export default async function BudgetsPage() {
  const workspace = await getWorkspace()
  if (!workspace) redirect("/sign-in")

  const data = await getBudgetsPageData(workspace.activeSpace.id)

  const totalBudgeted = data.budgets.reduce(
    (sum, budget) => sum + budget.amount,
    0
  )
  const totalSpent = data.budgets.reduce((sum, budget) => sum + budget.spent, 0)
  const headroom = totalBudgeted - totalSpent

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
          <Card size="sm" className="gap-0 py-0">
            <CardContent className="px-0">
              <div className="divide-y">
                {data.budgets.map((budget) => (
                  <BudgetRow key={budget.id} budget={budget} />
                ))}
              </div>
            </CardContent>
            <CardFooter className="justify-between gap-2 px-3 py-2">
              <span className="text-[13px] text-muted-foreground">
                {`${formatPenceShort(totalSpent)} spent of ${formatPenceShort(totalBudgeted)} budgeted`}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium tabular-nums",
                  headroom < 0 && "text-destructive"
                )}
              >
                {headroom >= 0
                  ? `${formatPenceShort(headroom)} left`
                  : `over by ${formatPenceShort(-headroom)}`}
              </span>
            </CardFooter>
          </Card>
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
          <ApexCardGrid className="lg:grid-cols-3">
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
