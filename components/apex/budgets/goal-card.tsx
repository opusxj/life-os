"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { motion, MotionConfig } from "motion/react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

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

import { formatPenceShort } from "./format"
import { GoalDrawer } from "./goal-drawer"

const spring = { type: "spring", stiffness: 500, damping: 32 } as const

export function GoalCard({
  goal,
  accounts,
  savingsAccounts,
}: {
  goal: SavingGoal
  accounts: AccountOption[]
  savingsAccounts: AccountOption[]
}) {
  const router = useRouter()
  const [topUpOpen, setTopUpOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  // Remount the edit drawer each open so its fields re-seed from fresh data
  const [editKey, setEditKey] = React.useState(0)
  const [, startTransition] = React.useTransition()

  const fraction = Math.min(1, goal.saved / goal.targetAmount)
  const hint = [onTrackHint(goal), goal.account && `via ${goal.account.name}`]
    .filter(Boolean)
    .join(" · ")

  function remove() {
    startTransition(async () => {
      await deleteSavingGoal(goal.id)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: goal.color }}
          />
          <span className="truncate text-[13px] font-medium">{goal.name}</span>
        </div>
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
            <DropdownMenuItem variant="destructive" onClick={remove}>
              <Trash2 /> Delete goal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProgressGrid
        target={goal.targetAmount}
        fraction={fraction}
        color={goal.color}
      />

      <div className="space-y-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-semibold tracking-tight tabular-nums">
            {formatPenceShort(goal.saved)}
          </span>
          <span className="text-[13px] text-muted-foreground">
            {`of ${formatPenceShort(goal.targetAmount)}`}
          </span>
        </div>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {`${Math.floor(fraction * 100)}% saved`}
        </span>
        <Button
          variant="secondary"
          size="xs"
          onClick={() => setTopUpOpen(true)}
        >
          Top up
        </Button>
      </div>

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
    </div>
  )
}

/**
 * The hero: the target cut into cells that fill as savings grow.
 * 1% cells for big targets, chunkier cells for small ones.
 */
function ProgressGrid({
  target,
  fraction,
  color,
}: {
  target: number
  fraction: number
  color: string
}) {
  const cells = target >= 1_000_000 ? 100 : target >= 100_000 ? 50 : 20
  const exact = fraction * cells
  const full = Math.floor(exact)
  const hasPartial = full < cells && exact - full > 0.02

  return (
    <MotionConfig reducedMotion="user">
      <div
        role="img"
        aria-label={`${Math.floor(fraction * 100)}% of target saved`}
        className="grid grid-cols-10 gap-1"
      >
        {Array.from({ length: cells }, (_, index) => {
          const isFull = index < full
          const isPartial = index === full && hasPartial
          if (!isFull && !isPartial) {
            return (
              <span
                key={index}
                className="aspect-square rounded-[3px] bg-muted"
              />
            )
          }
          return (
            <motion.span
              key={index}
              className="aspect-square rounded-[3px]"
              style={{ backgroundColor: color }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: isPartial ? 0.45 : 1, scale: 1 }}
              transition={{ ...spring, delay: Math.min(index * 0.006, 0.45) }}
            />
          )
        })}
      </div>
    </MotionConfig>
  )
}

function TopUpDrawer({
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
              ? `Moves money into ${goal.account.name}.`
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
              {pending ? "Topping up…" : "Top up"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

function onTrackHint(goal: SavingGoal): string | null {
  if (!goal.targetOn) return null
  const remaining = goal.targetAmount - goal.saved
  if (remaining <= 0) return "goal reached"
  const target = new Date(`${goal.targetOn}T00:00:00`)
  const now = new Date()
  const months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  const label = format(target, "MMM yyyy")
  if (months <= 0) return `target date ${label} has passed`
  const perMonth = Math.ceil(remaining / months / 100) * 100
  return `needs ${formatPenceShort(perMonth)}/month to hit ${label}`
}
