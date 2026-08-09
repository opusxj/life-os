"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { ConfirmDialog } from "@/components/apex/confirm-dialog"
import { MeterHead } from "@/components/apex/meter"
import { DataProgress } from "@/components/apex/progress"
import { ApexStatTag } from "@/components/apex/stat-card"
import { FormError } from "@/components/shared/form-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  removeBudget,
  updateBudgetAmount,
  type BudgetsFormState,
} from "@/lib/apex/budgets/actions"
import type { Budget } from "@/lib/apex/budgets/queries"
import { formatPenceShort } from "@/lib/apex/money"

export function BudgetRow({ budget, tick }: { budget: Budget; tick: number }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [removeError, setRemoveError] = React.useState<string | null>(null)
  const [removing, startTransition] = React.useTransition()

  const over = budget.spent > budget.amount
  const percent = Math.min(100, (budget.spent / budget.amount) * 100)

  function remove() {
    startTransition(async () => {
      const result = await removeBudget(budget.id)
      if (result.error) {
        setRemoveError(result.error)
        return
      }
      setConfirmOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: budget.category.color }}
      />
      <div className="min-w-0 flex-1">
        <MeterHead
          className="mb-0 items-center"
          name={budget.category.name}
          nameClassName="truncate text-[13px] font-medium text-foreground"
          trailing={
            over && (
              <ApexStatTag tint="destructive" className="ml-auto shrink-0">
                {`${formatPenceShort(budget.spent - budget.amount)} over`}
              </ApexStatTag>
            )
          }
          amount={
            <>
              <span className="font-medium">
                {formatPenceShort(budget.spent)}
              </span>
              <span className="text-muted-foreground">
                {` of ${formatPenceShort(budget.amount)}`}
              </span>
            </>
          }
          amountClassName="shrink-0 text-[13px] font-normal"
        />
        <DataProgress
          value={percent}
          color={over ? "var(--destructive)" : budget.category.color}
          dim={over}
          tick={tick}
          tickLabel={`${Math.round(tick)}% through the month`}
          aria-label={`${budget.category.name} budget used`}
          className="mt-2"
        />
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
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              setRemoveError(null)
              setConfirmOpen(true)
            }}
          >
            <Trash2 /> Remove budget
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditBudgetDialog
        budget={budget}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Remove ${budget.category.name} budget?`}
        description="The monthly envelope goes; the category and its transactions stay."
        confirmLabel="Remove budget"
        pending={removing}
        error={removeError}
        onConfirm={remove}
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

          <FormError>{state?.error}</FormError>

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
