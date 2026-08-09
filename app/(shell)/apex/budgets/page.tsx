import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { PiggyBank, PieChart } from "lucide-react"

import { ApexCardGrid, ApexPage, ApexSection } from "@/components/apex/page"
import { BudgetRow } from "@/components/apex/budgets/budget-row"
import { GoalCard } from "@/components/apex/budgets/goal-card"
import { NewGoalButton } from "@/components/apex/budgets/goal-drawer"
import { LeftToSpendCard } from "@/components/apex/budgets/left-to-spend-card"
import { NewBudgetDialog } from "@/components/apex/budgets/new-budget-dialog"
import { OutsideBudgetsCard } from "@/components/apex/budgets/outside-budgets-card"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatMonth, parseDay, todayKey } from "@/lib/apex/dates"
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

  // One server clock for the whole page: the month name, the pace tick on
  // every bar, and the goal pills all read the same day.
  const today = todayKey()
  const now = parseDay(today)
  const monthName = formatMonth(now)
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate()
  const monthTick = Math.round((now.getDate() / daysInMonth) * 100)
  const daysLeft = daysInMonth - now.getDate()

  // Attention lands where it's needed without scrolling: blown envelopes
  // first (worst first), then by how used each one is.
  const budgets = [...data.budgets].sort((a, b) => {
    const aOver = a.spent - a.amount
    const bOver = b.spent - b.amount
    if (aOver > 0 || bOver > 0) return bOver - aOver
    return b.spent / b.amount - a.spent / a.amount
  })

  const hasOutside =
    data.outsideBudgets.reduce((sum, part) => sum + part.amount, 0) > 0

  return (
    <ApexPage>
      {/* The band a title would fill carries nothing no card owns, so the
          page opens on its first section (design skill: page headers earn
          their space or go) */}
      <h1 className="sr-only">Budgets & savings</h1>

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
                Give a category a monthly envelope. Spending you log counts
                against it.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <LeftToSpendCard
                spent={totalSpent}
                budgeted={totalBudgeted}
                monthName={monthName}
                monthTick={monthTick}
                daysLeft={daysLeft}
                className={cn(hasOutside ? "lg:col-span-2" : "lg:col-span-3")}
              />
              <OutsideBudgetsCard
                parts={data.outsideBudgets}
                monthName={monthName}
              />
            </div>

            <Card size="sm" className="py-1">
              <CardContent className="px-1">
                <div className="grid gap-x-6 xl:grid-cols-2">
                  {budgets.map((budget) => (
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
                Name it, set a target, and each top up fills a square.
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
                today={today}
              />
            ))}
          </ApexCardGrid>
        )}
      </ApexSection>
    </ApexPage>
  )
}
