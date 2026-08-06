"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { APEX_COLORS, CARD_BRANDS } from "@/components/apex/accounts/meta"
import { ColorSwatches } from "@/components/shared/color-swatches"
import { MetaDot } from "@/components/shared/meta-dot"
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
import { saveCard, type ApexFormState } from "@/lib/apex/accounts/actions"
import type { Account } from "@/lib/apex/accounts/queries"

/** Sentinel for the optional brand — Base UI Select item values must be real
 *  strings; the hidden input maps it back to "" for FormData. */
const NO_BRAND = "none"

const BRAND_ITEMS = {
  [NO_BRAND]: "—",
  ...Object.fromEntries(CARD_BRANDS.map((brand) => [brand.value, brand.label])),
}

export function CardFormSheet({
  open,
  onOpenChange,
  accounts,
  defaultAccountId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  defaultAccountId?: string
}) {
  const router = useRouter()
  const defaultAccount =
    accounts.find((account) => account.id === defaultAccountId) ?? accounts[0]
  const [color, setColor] = React.useState(
    defaultAccount?.color ?? APEX_COLORS[1]
  )
  const [accountId, setAccountId] = React.useState(defaultAccount?.id ?? "")
  const [brand, setBrand] = React.useState(NO_BRAND)
  const accountItems = Object.fromEntries(
    accounts.map((account) => [account.id, account.name])
  )
  const [state, action, pending] = React.useActionState<
    ApexFormState,
    FormData
  >(async (prev, formData) => {
    const result = await saveCard(prev, formData)
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
          <SheetTitle>Add card</SheetTitle>
          <SheetDescription>
            {
              "The physical or virtual card. We only ever keep the last four digits."
            }
          </SheetDescription>
        </SheetHeader>

        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            <div className="space-y-1.5">
              <Label htmlFor="card-account" className="text-[13px]">
                Account
              </Label>
              <input type="hidden" name="accountId" value={accountId} />
              <Select
                items={accountItems}
                value={accountId}
                onValueChange={(value) => setAccountId(value as string)}
              >
                <SelectTrigger id="card-account" className="w-full">
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="card-name" className="text-[13px]">
                Name
              </Label>
              <Input
                id="card-name"
                name="name"
                placeholder="John's Monzo"
                maxLength={60}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="card-brand" className="text-[13px]">
                  Brand
                </Label>
                <input
                  type="hidden"
                  name="brand"
                  value={brand === NO_BRAND ? "" : brand}
                />
                <Select
                  items={BRAND_ITEMS}
                  value={brand}
                  onValueChange={(value) => setBrand(value as string)}
                >
                  <SelectTrigger id="card-brand" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_BRAND}>—</SelectItem>
                    {CARD_BRANDS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card-last4" className="text-[13px]">
                  Last four
                </Label>
                <Input
                  id="card-last4"
                  name="last4"
                  placeholder="4821"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="\d{4}"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="card-expires" className="text-[13px]">
                Expires
                <span className="text-muted-foreground">
                  <MetaDot />
                  optional
                </span>
              </Label>
              <Input id="card-expires" name="expires" type="month" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Color</Label>
              <ColorSwatches value={color} onChange={setColor} />
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
              {pending ? "Adding…" : "Add card"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
