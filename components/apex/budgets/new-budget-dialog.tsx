"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createBudget, type BudgetsFormState } from "@/lib/apex/budgets/actions"
import type { CategoryOption } from "@/lib/apex/budgets/queries"

export function NewBudgetDialog({
  categories,
}: {
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [categoryId, setCategoryId] = React.useState<string | null>(null)
  const [state, action, pending] = React.useActionState<
    BudgetsFormState,
    FormData
  >(async (prev, formData) => {
    const result = await createBudget(prev, formData)
    if (result?.success) {
      setOpen(false)
      setCategoryId(null)
      router.refresh()
    }
    return result
  }, undefined)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        New budget
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New budget</DialogTitle>
            <DialogDescription>
              A monthly envelope for one category.
            </DialogDescription>
          </DialogHeader>

          {categories.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              Every expense category already has a budget.
            </p>
          ) : (
            <form action={action} className="space-y-4">
              <input type="hidden" name="categoryId" value={categoryId ?? ""} />
              <div className="space-y-1.5">
                <Label className="text-[13px]">Category</Label>
                <Select
                  value={categoryId}
                  onValueChange={(value) => setCategoryId(value as string)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span
                          aria-hidden
                          className="size-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="budget-amount" className="text-[13px]">
                  Monthly amount
                </Label>
                <Input
                  id="budget-amount"
                  name="amount"
                  inputMode="decimal"
                  placeholder="£450"
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
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || !categoryId}>
                  {pending ? "Adding…" : "Add budget"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
