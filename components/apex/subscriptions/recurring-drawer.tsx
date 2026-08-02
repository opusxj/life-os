"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
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
  RecurringKind,
  RecurringPayment,
} from "@/lib/apex/subscriptions/queries"
import { cn } from "@/lib/utils"

const KIND_OPTIONS: { value: RecurringKind; label: string }[] = [
  { value: "subscription", label: "Subscription" },
  { value: "bill", label: "Bill" },
]

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
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                {KIND_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={kind === option.value}
                    onClick={() => setKind(option.value)}
                    className={cn(
                      "h-6 rounded-md text-[13px] font-medium transition-colors",
                      kind === option.value
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
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
                <NativeSelect
                  id="recurring-cadence"
                  name="cadence"
                  defaultValue={payment?.cadence ?? "monthly"}
                  className="w-full"
                >
                  <NativeSelectOption value="weekly">Weekly</NativeSelectOption>
                  <NativeSelectOption value="monthly">Monthly</NativeSelectOption>
                  <NativeSelectOption value="quarterly">Quarterly</NativeSelectOption>
                  <NativeSelectOption value="yearly">Yearly</NativeSelectOption>
                </NativeSelect>
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
              <NativeSelect
                id="recurring-account"
                name="accountId"
                defaultValue={payment?.accountId ?? ""}
                className="w-full"
              >
                <NativeSelectOption value="">
                  None — ask when paying
                </NativeSelectOption>
                {accounts.map((account) => (
                  <NativeSelectOption key={account.id} value={account.id}>
                    {account.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recurring-category" className="text-[13px]">
                Category
              </Label>
              <NativeSelect
                id="recurring-category"
                name="categoryId"
                defaultValue={payment?.categoryId ?? ""}
                className="w-full"
              >
                <NativeSelectOption value="">None</NativeSelectOption>
                {categories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
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
