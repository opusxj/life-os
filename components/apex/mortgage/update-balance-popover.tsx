"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  updateMortgageBalance,
  type MortgageFormState,
} from "@/lib/apex/mortgage/actions"

/**
 * The Balance card's quick action. Mortgages are manually maintained — this
 * writes the new figure straight to the row and never touches accounts.
 */
export function UpdateBalancePopover({
  mortgageId,
  balance,
}: {
  mortgageId: string
  balance: number
}) {
  const [open, setOpen] = React.useState(false)
  const [state, action, pending] = React.useActionState<
    MortgageFormState,
    FormData
  >(async (prev, formData) => {
    const result = await updateMortgageBalance(prev, formData)
    if (result?.success) setOpen(false)
    return result
  }, undefined)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="xs" />}>
        Update balance
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60">
        <PopoverHeader>
          <PopoverTitle className="text-[13px]">Update balance</PopoverTitle>
          <PopoverDescription className="text-[13px]">
            {`Straight from your latest statement.`}
          </PopoverDescription>
        </PopoverHeader>
        <form action={action} className="space-y-2.5">
          <input type="hidden" name="id" value={mortgageId} />
          <div className="space-y-1.5">
            <Label htmlFor={`balance-${mortgageId}`} className="text-[13px]">
              Current balance
            </Label>
            <Input
              id={`balance-${mortgageId}`}
              name="balance"
              inputMode="decimal"
              defaultValue={(balance / 100).toFixed(2)}
              autoFocus
              required
            />
          </div>
          {state?.error && (
            <p role="alert" className="text-[13px] text-destructive">
              {state.error}
            </p>
          )}
          <Button type="submit" size="sm" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save balance"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
