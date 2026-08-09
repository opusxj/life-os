"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, PiggyBank, Plus, Trash2 } from "lucide-react"

import { ConfirmDialog } from "@/components/apex/confirm-dialog"
import { ProgressGrid } from "@/components/apex/budgets/progress-grid"
import {
  ApexStatCard,
  ApexStatFigure,
  ApexStatHint,
  ApexStatTag,
  ApexStatUnit,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { FormError } from "@/components/shared/form-error"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  deleteSavingGoal,
  topUpGoal,
  type BudgetsFormState,
} from "@/lib/apex/budgets/actions"
import type { AccountOption, SavingGoal } from "@/lib/apex/budgets/queries"
import { formatMonthYear, parseDay } from "@/lib/apex/dates"
import { formatPenceShort } from "@/lib/apex/money"

import { GoalDrawer } from "./goal-drawer"

export function GoalCard({
  goal,
  accounts,
  savingsAccounts,
  today,
}: {
  goal: SavingGoal
  accounts: AccountOption[]
  savingsAccounts: AccountOption[]
  /** yyyy-mm-dd resolved server-side, so the target pills can't flip on the
   *  visitor's clock (the client-clock trap in the audit) */
  today: string
}) {
  const router = useRouter()
  const [topUpOpen, setTopUpOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  // Remount the edit drawer each open so its fields re-seed from fresh data
  const [editKey, setEditKey] = React.useState(0)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const [deleting, startTransition] = React.useTransition()

  const fraction = Math.min(1, goal.saved / goal.targetAmount)
  const percent = Math.floor(fraction * 100)
  const reached = goal.saved >= goal.targetAmount
  const targetLabel = goal.targetOn ? formatMonthYear(goal.targetOn) : null
  // Same month arithmetic as paceHint, so pill and hint can never disagree
  const targetPassed = goal.targetOn
    ? monthsToTarget(goal.targetOn, today) <= 0
    : false
  const hint = paceHint(goal, today)

  function remove() {
    startTransition(async () => {
      const result = await deleteSavingGoal(goal.id)
      if (result.error) {
        setDeleteError(result.error)
        return
      }
      setConfirmOpen(false)
      router.refresh()
    })
  }

  return (
    <ApexStatCard
      label={goal.name}
      description={
        goal.account
          ? `From your ${goal.account.name} balance`
          : "From the top ups you've logged"
      }
      icon={PiggyBank}
      iconColor={goal.color}
      action={
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Actions for ${goal.name}`}
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => {
                setEditKey((key) => key + 1)
                setEditOpen(true)
              }}
            >
              <Pencil /> Edit goal
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setDeleteError(null)
                setConfirmOpen(true)
              }}
            >
              <Trash2 /> Delete goal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
      footer={
        <Button variant="ghost" size="xs" onClick={() => setTopUpOpen(true)}>
          <Plus data-icon="inline-start" />
          Top up
        </Button>
      }
    >
      <ApexStatValue>
        <ApexStatFigure>{formatPenceShort(goal.saved)}</ApexStatFigure>{" "}
        <ApexStatUnit>{`of ${formatPenceShort(goal.targetAmount)}`}</ApexStatUnit>
      </ApexStatValue>

      <ProgressGrid
        target={goal.targetAmount}
        saved={goal.saved}
        color={goal.color}
        className="mt-3"
      />

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {reached ? (
          <ApexStatTag tint="balance">Goal reached</ApexStatTag>
        ) : (
          <ApexStatTag tint="balance">{`${percent}% saved`}</ApexStatTag>
        )}
        {!reached &&
          targetLabel &&
          (targetPassed ? (
            <ApexStatTag tint="neutral">{`Target was ${targetLabel}`}</ApexStatTag>
          ) : (
            <ApexStatTag tint="due">{`Target by ${targetLabel}`}</ApexStatTag>
          ))}
      </div>

      {hint && <ApexStatHint className="mt-2.5">{hint}</ApexStatHint>}

      <TopUpDrawer
        goal={goal}
        accounts={accounts}
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
      />
      <GoalDrawer
        key={editKey}
        goal={goal}
        savingsAccounts={savingsAccounts}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${goal.name}?`}
        description={
          goal.account
            ? `The goal and its target go; ${goal.account.name} and its balance are untouched.`
            : `The goal and the ${formatPenceShort(goal.saved)} tracked against it go.`
        }
        confirmLabel="Delete goal"
        pending={deleting}
        error={deleteError}
        onConfirm={remove}
      />
    </ApexStatCard>
  )
}

export function TopUpDrawer({
  goal,
  accounts,
  open,
  onOpenChange,
}: {
  goal: SavingGoal
  accounts: AccountOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const sources = accounts.filter((account) => account.id !== goal.account?.id)
  const defaultSource =
    sources.find((account) => account.kind === "current") ?? sources[0]
  const [sourceId, setSourceId] = React.useState<string>(
    defaultSource?.id ?? ""
  )
  const [state, action, pending] = React.useActionState<
    BudgetsFormState,
    FormData
  >(async (prev, formData) => {
    const result = await topUpGoal(prev, formData)
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
          <DrawerTitle>{`Top up ${goal.name}`}</DrawerTitle>
          <DrawerDescription>
            {goal.account
              ? `Records a transfer into ${goal.account.name}.`
              : "Adds to the amount you've put aside."}
          </DrawerDescription>
        </DrawerHeader>

        <form
          action={action}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
        >
          <input type="hidden" name="goalId" value={goal.id} />

          <div className="space-y-1.5">
            <Label htmlFor={`top-up-${goal.id}`} className="text-[13px]">
              Amount
            </Label>
            <Input
              id={`top-up-${goal.id}`}
              name="amount"
              inputMode="decimal"
              placeholder="£50"
              autoComplete="off"
              required
            />
          </div>

          {goal.account && (
            <div className="space-y-1.5">
              <Label className="text-[13px]">From account</Label>
              <input type="hidden" name="sourceAccountId" value={sourceId} />
              <Select
                value={sourceId}
                onValueChange={(value) => setSourceId(value as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick an account" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                      <span className="text-muted-foreground tabular-nums">
                        {formatPenceShort(account.balance)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <FormError>{state?.error}</FormError>

          <DrawerFooter className="mt-auto flex-row justify-end p-0 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Topping up…" : "Top up"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

/**
 * The pace sentence: what the goal needs each month to land on time. The
 * target date itself lives in the target pill, so this line never repeats it;
 * "Goal reached" is the emerald tag's job, and a passed target is the
 * neutral pill's, so both return null rather than stating a fact twice.
 */
function paceHint(goal: SavingGoal, today: string): string | null {
  if (!goal.targetOn) return null
  const remaining = goal.targetAmount - goal.saved
  if (remaining <= 0) return null
  const months = monthsToTarget(goal.targetOn, today)
  if (months <= 0) return null
  const perMonth = Math.ceil(remaining / months / 100) * 100
  return `Needs ${formatPenceShort(perMonth)} a month to hit the target.`
}

/** Whole months from this month to the target's month; 0 or less once passed */
function monthsToTarget(targetOn: string, today: string): number {
  const target = parseDay(targetOn)
  const now = parseDay(today)
  return (
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  )
}
