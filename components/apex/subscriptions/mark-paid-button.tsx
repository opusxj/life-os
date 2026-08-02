"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
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
      <Button
        size="xs"
        variant={error ? "destructive" : "outline"}
        title={error ?? undefined}
        disabled={pending}
        onClick={() => pay()}
      >
        {pending ? "Paying…" : error ? "Retry" : "Mark paid"}
      </Button>
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
        <NativeSelect
          id={`pay-account-${paymentId}`}
          value={pickedAccount}
          onChange={(event) => setPickedAccount(event.target.value)}
          className="w-full"
        >
          {accounts.map((account) => (
            <NativeSelectOption key={account.id} value={account.id}>
              {account.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {error && (
          <p role="alert" className="text-[13px] text-destructive">
            {error}
          </p>
        )}
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
