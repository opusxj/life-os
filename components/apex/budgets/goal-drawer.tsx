"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createSavingGoal,
  updateSavingGoal,
  type BudgetsFormState,
} from "@/lib/apex/budgets/actions"
import {
  ColorSwatches,
  SWATCH_COLORS,
} from "@/components/shared/color-swatches"
import type { AccountOption, SavingGoal } from "@/lib/apex/budgets/queries"

const GOAL_COLORS = SWATCH_COLORS

const UNLINKED = "unlinked"

/** Create + edit share one drawer: pass `goal` to edit. */
export function GoalDrawer({
  goal,
  savingsAccounts,
  open,
  onOpenChange,
}: {
  goal?: SavingGoal
  savingsAccounts: AccountOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [color, setColor] = React.useState(goal?.color ?? GOAL_COLORS[0])
  const [accountId, setAccountId] = React.useState<string>(
    goal?.account?.id ?? UNLINKED
  )
  // Without `items`, Base UI's SelectValue renders the raw id in the trigger
  const accountItems = {
    [UNLINKED]: "Not linked",
    ...Object.fromEntries(
      savingsAccounts.map((account) => [account.id, account.name])
    ),
  }
  const [state, action, pending] = React.useActionState<
    BudgetsFormState,
    FormData
  >(async (prev, formData) => {
    const result = goal
      ? await updateSavingGoal(prev, formData)
      : await createSavingGoal(prev, formData)
    if (result?.success) {
      onOpenChange(false)
      router.refresh()
    }
    return result
  }, undefined)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{goal ? "Edit goal" : "New saving goal"}</DrawerTitle>
          <DrawerDescription>
            {goal
              ? "Adjust the target, link or look."
              : "Something to put money aside for."}
          </DrawerDescription>
        </DrawerHeader>

        <form
          action={action}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
        >
          {goal && <input type="hidden" name="goalId" value={goal.id} />}
          <input
            type="hidden"
            name="accountId"
            value={accountId === UNLINKED ? "" : accountId}
          />

          <div className="space-y-1.5">
            <Label htmlFor="goal-name" className="text-[13px]">
              Name
            </Label>
            <Input
              id="goal-name"
              name="name"
              placeholder="House deposit"
              defaultValue={goal?.name}
              maxLength={60}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-target" className="text-[13px]">
              Target amount
            </Label>
            <Input
              id="goal-target"
              name="targetAmount"
              inputMode="decimal"
              placeholder="£5,000"
              defaultValue={goal ? (goal.targetAmount / 100).toString() : ""}
              autoComplete="off"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Linked savings account</Label>
            <Select
              items={accountItems}
              value={accountId}
              onValueChange={(value) => setAccountId(value as string)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNLINKED}>Not linked</SelectItem>
                {savingsAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {`Linked goals track the account's balance; unlinked goals count top-ups.`}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-target-on" className="text-[13px]">
              Target date{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="goal-target-on"
              name="targetOn"
              type="date"
              defaultValue={goal?.targetOn ?? ""}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Color</Label>
            <ColorSwatches value={color} onChange={setColor} />
          </div>

          {state?.error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive"
            >
              {state.error}
            </p>
          )}

          <DrawerFooter className="mt-auto flex-row justify-end p-0 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : goal ? "Save goal" : "Create goal"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

export function NewGoalButton({
  savingsAccounts,
}: {
  savingsAccounts: AccountOption[]
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        New goal
      </Button>
      <GoalDrawer
        savingsAccounts={savingsAccounts}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
