import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PiggyBank, PieChart, Wallet } from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
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
import { DataProgress } from "@/components/apex/progress"
import {
  ApexStatCard,
  ApexStatFigure,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { MetaDot } from "@/components/shared/meta-dot"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getBudgetsPageData } from "@/lib/apex/budgets/queries"
import { formatPenceShort } from "@/lib/apex/money"
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
  const over = headroom < 0
  const spentPercent =
    totalBudgeted > 0 ? Math.min(100, (totalSpent / totalBudgeted) * 100) : 0

  // Pace marker: how far through the month we are, resolved server-side so
  // every budget bar shares the same tick.
  const now = new Date()
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate()
  const monthTick = Math.round((now.getDate() / daysInMonth) * 100)

  return (
    <ApexPage>
      <ApexPageHeader title="Budgets & Savings" />

      <ApexSection
        label="Budgets"
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
          <>
            <ApexStatCard
              label="Headroom"
              icon={Wallet}
              iconClassName={ANCHOR_TINTS.primary}
            >
              <ApexStatValue className={cn(over && "text-destructive")}>
                {over ? (
                  <>
                    Over by{" "}
                    <ApexStatFigure negative>
                      {formatPenceShort(-headroom)}
                    </ApexStatFigure>
                  </>
                ) : (
                  <>
                    <ApexStatFigure>{formatPenceShort(headroom)}</ApexStatFigure>{" "}
                    left
                  </>
                )}
              </ApexStatValue>
              <DataProgress
                value={spentPercent}
                color={over ? "var(--destructive)" : "var(--primary)"}
                dim={over}
                tick={monthTick}
                tickLabel={`${monthTick}% through the month`}
                aria-label="Spent of budgeted this month"
                className="mt-2"
              />
              <ApexStatHint className="mt-1.5">
                {`${formatPenceShort(totalSpent)} of ${formatPenceShort(totalBudgeted)}`}
                <MetaDot />
                {data.monthLabel}
              </ApexStatHint>
            </ApexStatCard>

            <Card size="sm" className="py-1">
              <CardContent className="px-1">
                <div className="grid gap-x-6 xl:grid-cols-2">
                  {data.budgets.map((budget) => (
                    <BudgetRow
                      key={budget.id}
                      budget={budget}
                      tick={monthTick}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
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
