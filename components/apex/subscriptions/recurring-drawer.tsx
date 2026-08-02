"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  saveRecurringPayment,
  type RecurringFormState,
} from "@/lib/apex/subscriptions/actions"
import type {
  AccountOption,
  CategoryOption,
  RecurringCadence,
  RecurringKind,
  RecurringPayment,
} from "@/lib/apex/subscriptions/queries"

const KIND_OPTIONS: { value: RecurringKind; label: string }[] = [
  { value: "subscription", label: "Subscription" },
  { value: "bill", label: "Bill" },
]

/** Sentinel for the optional "None" choices — Base UI Select item values must
 *  be real strings; the hidden inputs map it back to "" for FormData. */
const NONE = "none"

const CADENCE_ITEMS = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
}

/** Add/edit drawer — minimum viable fields, everything optional that can be. */
export function RecurringDrawer({
  open,
  onOpenChange,
  spaceId,
  accounts,
  categories,
  payment,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceId: string
  accounts: AccountOption[]
  categories: CategoryOption[]
  /** null = create */
  payment: RecurringPayment | null
}) {
  const router = useRouter()
  const [kind, setKind] = React.useState<RecurringKind>(
    payment?.kind ?? "subscription"
  )
  const [cadence, setCadence] = React.useState(payment?.cadence ?? "monthly")
  const [accountId, setAccountId] = React.useState(payment?.accountId ?? NONE)
  const [categoryId, setCategoryId] = React.useState(
    payment?.categoryId ?? NONE
  )
  const accountItems = {
    [NONE]: "None — ask when paying",
    ...Object.fromEntries(
      accounts.map((account) => [account.id, account.name])
    ),
  }
  const categoryItems = {
    [NONE]: "None",
    ...Object.fromEntries(
      categories.map((category) => [category.id, category.name])
    ),
  }
  const [state, action, pending] = React.useActionState<
    RecurringFormState,
    FormData
  >(async (prev, formData) => {
    const result = await saveRecurringPayment(prev, formData)
    if (result?.success) {
      onOpenChange(false)
      router.refresh()
    }
    return result
  }, undefined)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>
            {payment ? "Edit recurring payment" : "Add subscription or bill"}
          </SheetTitle>
          <SheetDescription>
            {"A schedule, not a charge — nothing posts until you mark it paid."}
          </SheetDescription>
        </SheetHeader>

        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-4 overflow-y-auto px-4">
            {payment && <input type="hidden" name="id" value={payment.id} />}
            <input type="hidden" name="spaceId" value={spaceId} />
            <input type="hidden" name="kind" value={kind} />

            <div className="space-y-1.5">
              <Label htmlFor="recurring-name" className="text-[13px]">
                Name
              </Label>
              <Input
                id="recurring-name"
                name="name"
                placeholder="Netflix"
                defaultValue={payment?.name}
                maxLength={80}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Kind</Label>
              <ToggleGroup
                aria-label="Kind"
                value={[kind]}
                onValueChange={(value) => {
                  if (value.length > 0) {
                    setKind(value[0] as (typeof KIND_OPTIONS)[number]["value"])
                  }
                }}
                variant="outline"
                size="sm"
                spacing={0}
                className="w-full"
              >
                {KIND_OPTIONS.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    className="flex-1 text-[13px]"
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="recurring-amount" className="text-[13px]">
                  Amount
                </Label>
                <Input
                  id="recurring-amount"
                  name="amount"
                  inputMode="decimal"
                  placeholder="£9.99"
                  defaultValue={
                    payment ? (payment.amount / 100).toFixed(2) : undefined
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recurring-cadence" className="text-[13px]">
                  Cadence
                </Label>
                <input type="hidden" name="cadence" value={cadence} />
                <Select
                  items={CADENCE_ITEMS}
                  value={cadence}
                  onValueChange={(value) =>
                    setCadence(value as RecurringCadence)
                  }
                >
                  <SelectTrigger id="recurring-cadence" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recurring-due" className="text-[13px]">
                Next due
              </Label>
              <Input
                id="recurring-due"
                name="nextDueOn"
                type="date"
                defaultValue={payment?.nextDueOn}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recurring-account" className="text-[13px]">
                Paying account
              </Label>
              <input
                type="hidden"
                name="accountId"
                value={accountId === NONE ? "" : accountId}
              />
              <Select
                items={accountItems}
                value={accountId}
                onValueChange={(value) => setAccountId(value as string)}
              >
                <SelectTrigger id="recurring-account" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None — ask when paying</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recurring-category" className="text-[13px]">
                Category
              </Label>
              <input
                type="hidden"
                name="categoryId"
                value={categoryId === NONE ? "" : categoryId}
              />
              <Select
                items={categoryItems}
                value={categoryId}
                onValueChange={(value) => setCategoryId(value as string)}
              >
                <SelectTrigger id="recurring-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {state?.error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive"
              >
                {state.error}
              </p>
            )}
          </div>

          <SheetFooter className="flex-row justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : payment ? "Save changes" : "Add"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
