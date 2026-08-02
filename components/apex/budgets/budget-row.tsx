"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, MotionConfig } from "motion/react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  removeBudget,
  updateBudgetAmount,
  type BudgetsFormState,
} from "@/lib/apex/budgets/actions"
import type { Budget } from "@/lib/apex/budgets/queries"

import { formatPenceShort } from "./format"

const spring = { type: "spring", stiffness: 500, damping: 32 } as const

export function BudgetRow({ budget }: { budget: Budget }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [, startTransition] = React.useTransition()

  const over = budget.spent > budget.amount
  const percent = Math.min(100, (budget.spent / budget.amount) * 100)

  function remove() {
    startTransition(async () => {
      await removeBudget(budget.id)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: budget.category.color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-medium">
            {budget.category.name}
          </span>
          <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
            {`${formatPenceShort(budget.spent)} of ${formatPenceShort(budget.amount)}`}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <MotionConfig reducedMotion="user">
              <motion.div
                className={
                  over
                    ? "h-full rounded-full bg-destructive/60"
                    : "h-full rounded-full"
                }
                style={
                  over ? undefined : { backgroundColor: budget.category.color }
                }
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={spring}
              />
            </MotionConfig>
          </div>
          {over && (
            <span className="shrink-0 text-[11px] text-destructive tabular-nums">
              {`over by ${formatPenceShort(budget.spent - budget.amount)}`}
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Actions for ${budget.category.name} budget`}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil /> Edit amount
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={remove}>
            <Trash2 /> Remove budget
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditBudgetDialog
        budget={budget}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}

function EditBudgetDialog({
  budget,
  open,
  onOpenChange,
}: {
  budget: Budget
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [state, action, pending] = React.useActionState<
    BudgetsFormState,
    FormData
  >(async (prev, formData) => {
    const result = await updateBudgetAmount(prev, formData)
    if (result?.success) {
      onOpenChange(false)
      router.refresh()
    }
    return result
  }, undefined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{`Edit ${budget.category.name} budget`}</DialogTitle>
          <DialogDescription>
            The monthly envelope for this category.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="budgetId" value={budget.id} />
          <div className="space-y-1.5">
            <Label
              htmlFor={`budget-amount-${budget.id}`}
              className="text-[13px]"
            >
              Monthly amount
            </Label>
            <Input
              id={`budget-amount-${budget.id}`}
              name="amount"
              inputMode="decimal"
              defaultValue={(budget.amount / 100).toString()}
              autoComplete="off"
              required
            />
          </div>

          {state?.error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive"
            >
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
