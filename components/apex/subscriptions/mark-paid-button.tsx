"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { FormError } from "@/components/shared/form-error"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { markRecurringPaid } from "@/lib/apex/subscriptions/actions"
import type { AccountOption } from "@/lib/apex/subscriptions/queries"

/**
 * Inline action on due/overdue rows. Items without a paying account get a tiny
 * popover asking which account first — the thought still finishes in place.
 */
export function MarkPaidButton({
  paymentId,
  accountId,
  accounts,
}: {
  paymentId: string
  accountId: string | null
  accounts: AccountOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pickedAccount, setPickedAccount] = React.useState(
    accounts[0]?.id ?? ""
  )
  const accountItems = Object.fromEntries(
    accounts.map((account) => [account.id, account.name])
  )

  function pay(payAccount?: string) {
    setError(null)
    startTransition(async () => {
      const result = await markRecurringPaid(paymentId, payAccount)
      if (result.error) {
        setError(result.error)
      } else {
        setPickerOpen(false)
        router.refresh()
      }
    })
  }

  if (accountId) {
    return (
      // Spans, not a FormError: callers place this inside inline flex rows
      <span className="inline-flex items-center gap-2">
        {error && (
          <span role="alert" className="text-[13px] text-destructive">
            {error}
          </span>
        )}
        <Button
          size="xs"
          variant={error ? "destructive" : "outline"}
          disabled={pending}
          onClick={() => pay()}
        >
          {pending ? "Paying…" : error ? "Retry" : "Mark paid"}
        </Button>
      </span>
    )
  }

  return (
    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
      <PopoverTrigger
        render={<Button size="xs" variant="outline" disabled={pending} />}
      >
        {pending ? "Paying…" : "Mark paid"}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 space-y-2 p-3">
        <Label htmlFor={`pay-account-${paymentId}`} className="text-[13px]">
          Pay from which account?
        </Label>
        <Select
          items={accountItems}
          value={pickedAccount}
          onValueChange={(value) => setPickedAccount(value as string)}
        >
          <SelectTrigger id={`pay-account-${paymentId}`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormError plain>{error}</FormError>
        <Button
          size="sm"
          className="w-full"
          disabled={pending || !pickedAccount}
          onClick={() => pay(pickedAccount)}
        >
          {pending ? "Paying…" : "Pay"}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
