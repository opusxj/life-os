"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { MoneyInput } from "@/components/apex/accounts/account-form-sheet"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { transferBetween, type ApexFormState } from "@/lib/apex/accounts/actions"
import { formatPence } from "@/lib/apex/money"
import type { Account } from "@/lib/apex/accounts/queries"

export function TransferSheet({
  open,
  onOpenChange,
  accounts,
  fromId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  fromId?: string
}) {
  const router = useRouter()
  const [state, action, pending] = React.useActionState<ApexFormState, FormData>(
    async (prev, formData) => {
      const result = await transferBetween(prev, formData)
      if (result?.success) {
        onOpenChange(false)
        router.refresh()
      }
      return result
    },
    undefined
  )

  const defaultFrom = fromId ?? accounts[0]?.id
  const defaultTo = accounts.find((account) => account.id !== defaultFrom)?.id
  // Both selects list every account; the server action rejects from === to.
  const [from, setFrom] = React.useState(defaultFrom ?? "")
  const [to, setTo] = React.useState(defaultTo ?? "")
  const accountItems = Object.fromEntries(
    accounts.map((account) => [
      account.id,
      `${account.name} · ${formatPence(account.balance)}`,
    ])
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Transfer</SheetTitle>
          <SheetDescription>
            {"Move money between two accounts — both balances update instantly."}
          </SheetDescription>
        </SheetHeader>

        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            <div className="space-y-1.5">
              <Label htmlFor="transfer-from" className="text-[13px]">
                From
              </Label>
              <input type="hidden" name="fromId" value={from} />
              <Select
                items={accountItems}
                value={from}
                onValueChange={(value) => setFrom(value as string)}
              >
                <SelectTrigger id="transfer-from" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {`${account.name} · ${formatPence(account.balance)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transfer-to" className="text-[13px]">
                To
              </Label>
              <input type="hidden" name="toId" value={to} />
              <Select
                items={accountItems}
                value={to}
                onValueChange={(value) => setTo(value as string)}
              >
                <SelectTrigger id="transfer-to" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {`${account.name} · ${formatPence(account.balance)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transfer-amount" className="text-[13px]">
                Amount
              </Label>
              <MoneyInput
                id="transfer-amount"
                name="amount"
                placeholder="0.00"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transfer-note" className="text-[13px]">
                Note
                <span className="text-muted-foreground"> · optional</span>
              </Label>
              <Input
                id="transfer-note"
                name="note"
                placeholder="Savings top up"
                maxLength={80}
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
          </div>

          <SheetFooter className="flex-row justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Transferring…" : "Transfer"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
