"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { TopUpDrawer } from "@/components/apex/budgets/goal-card"
import { ProgressGrid } from "@/components/apex/progress-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatPenceShort } from "@/lib/apex/money"
import type { AccountOption, SavingGoal } from "@/lib/apex/budgets/queries"

/**
 * One compact goal tile on the Overview savings strip: the shared cell grid
 * as a single 20-cell row, plus an in-place Top up (same drawer as Budgets).
 */
export function SavingsTile({
  goal,
  accounts,
}: {
  goal: SavingGoal
  accounts: AccountOption[]
}) {
  const [topUpOpen, setTopUpOpen] = React.useState(false)
  const fraction = Math.min(1, goal.saved / goal.targetAmount)
  const percent = Math.floor(fraction * 100)

  return (
    <Card size="sm" className="gap-0 py-2.5">
      <CardContent className="px-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[13px]">{goal.name}</p>
          <span className="text-[13px] font-semibold tabular-nums">
            {`${percent}%`}
          </span>
        </div>
        <ProgressGrid
          target={goal.targetAmount}
          fraction={fraction}
          color={goal.color}
          cells={20}
          className="mt-1.5 grid grid-cols-20 gap-0.5"
        />
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-[13px] text-muted-foreground tabular-nums">
            {`${formatPenceShort(goal.saved)} of ${formatPenceShort(goal.targetAmount)}`}
          </p>
          <Button
            variant="ghost"
            size="xs"
            className="-mr-1 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setTopUpOpen(true)}
          >
            <Plus data-icon="inline-start" />
            Top up
          </Button>
        </div>
      </CardContent>
      <TopUpDrawer
        goal={goal}
        accounts={accounts}
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
      />
    </Card>
  )
}
