"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

import { MoneyInput } from "@/components/apex/accounts/account-form-sheet"
import { FormError } from "@/components/shared/form-error"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { syncBalance, type ApexFormState } from "@/lib/apex/accounts/actions"
import { formatPenceShort } from "@/lib/apex/money"
import type { Account } from "@/lib/apex/accounts/queries"

/** The guilt-free reset: type what the bank says, Apex records the difference. */
export function SyncBalancePopover({ account }: { account: Account }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [state, action, pending] = React.useActionState<
    ApexFormState,
    FormData
  >(async (prev, formData) => {
    const result = await syncBalance(prev, formData)
    if (result?.success) {
      setOpen(false)
      router.refresh()
    }
    return result
  }, undefined)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="xs" className="text-muted-foreground" />
        }
      >
        <RefreshCw /> Sync
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <PopoverHeader>
          <PopoverTitle>Sync balance</PopoverTitle>
          <PopoverDescription className="text-[13px]">
            {`Apex has ${formatPenceShort(account.balance)}. What does the bank say?`}
          </PopoverDescription>
        </PopoverHeader>
        <form action={action} className="space-y-2.5">
          <input type="hidden" name="accountId" value={account.id} />
          <div className="space-y-1.5">
            <Label htmlFor={`sync-${account.id}`} className="sr-only">
              Actual balance
            </Label>
            <MoneyInput
              id={`sync-${account.id}`}
              name="actual"
              placeholder={(account.balance / 100).toFixed(2)}
              required
              autoFocus
            />
          </div>
          <FormError plain>{state?.error}</FormError>
          <Button type="submit" size="sm" className="w-full" disabled={pending}>
            {pending ? "Syncing…" : "Set balance"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
