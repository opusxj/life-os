"use client"

import * as React from "react"
import type { VariantProps } from "class-variance-authority"

import { FormError } from "@/components/shared/form-error"
import { Button, buttonVariants } from "@/components/ui/button"
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

type ButtonLook = VariantProps<typeof buttonVariants>

/**
 * The one way to correct a balance. Mortgages are manually maintained: this
 * writes the figure straight to the row and never touches accounts.
 *
 * The statement date travels with the amount because every projection on the
 * page is aged forward from it. Saving an amount alone would leave a figure
 * that quietly claims to be current for as long as nobody touches it again.
 */
export function UpdateBalancePopover({
  mortgageId,
  balance,
  balanceAsOf,
  today,
  variant = "ghost",
  size = "xs",
}: {
  mortgageId: string
  balance: number
  /** yyyy-mm-dd the stored balance was last true */
  balanceAsOf: string
  /** yyyy-mm-dd resolved server-side, so the date field can't run ahead */
  today: string
  variant?: ButtonLook["variant"]
  size?: ButtonLook["size"]
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
      <PopoverTrigger render={<Button variant={variant} size={size} />}>
        Update balance
      </PopoverTrigger>
      <PopoverContent align="end" className="w-68">
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
              Balance
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
          <div className="space-y-1.5">
            <Label htmlFor={`as-of-${mortgageId}`} className="text-[13px]">
              Statement date
            </Label>
            <Input
              id={`as-of-${mortgageId}`}
              name="balanceAsOf"
              type="date"
              defaultValue={balanceAsOf}
              max={today}
              required
            />
          </div>
          <FormError plain>{state?.error}</FormError>
          <Button type="submit" size="sm" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Save balance"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
