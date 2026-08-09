"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { TopUpDrawer } from "@/components/apex/budgets/goal-card"
import { MeterHead } from "@/components/apex/meter"
import { DataProgress } from "@/components/apex/progress"
import { ApexStatTag } from "@/components/apex/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatPenceShort } from "@/lib/apex/money"
import type { AccountOption, SavingGoal } from "@/lib/apex/budgets/queries"

/**
 * One compact goal tile on the Overview savings strip: progress toward the
 * target as the house DataProgress in the goal's own color, the saved-of-
 * target fact as a pill, plus an in-place Top up (same drawer as Budgets).
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
    <Card size="sm" className="gap-0 rounded-xl py-3">
      <CardContent className="px-3">
        <MeterHead
          className="mb-0"
          name={goal.name}
          nameClassName="truncate text-[13px] font-medium text-foreground"
          amount={
            <>
              <span className="font-semibold text-foreground tabular-nums">
                {`${percent}%`}
              </span>
              {" saved"}
            </>
          }
          amountClassName="shrink-0 text-[13px] font-normal text-muted-foreground"
        />
        <DataProgress
          value={fraction * 100}
          color={goal.color}
          aria-label={`${goal.name}: ${percent}% of target saved`}
          className="mt-2"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <ApexStatTag tint="balance">
            {`${formatPenceShort(goal.saved)} of ${formatPenceShort(goal.targetAmount)}`}
          </ApexStatTag>
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
