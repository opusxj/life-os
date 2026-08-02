"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  APEX_COLORS,
  CARD_BRANDS,
} from "@/components/apex/accounts/meta"
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
import { saveCard, type ApexFormState } from "@/lib/apex/accounts/actions"
import type { Account } from "@/lib/apex/accounts/queries"
import { cn } from "@/lib/utils"

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
  const [state, action, pending] = React.useActionState<ApexFormState, FormData>(
    async (prev, formData) => {
      const result = await saveCard(prev, formData)
      if (result?.success) {
        onOpenChange(false)
        router.refresh()
      }
      return result
    },
    undefined
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Add card</SheetTitle>
          <SheetDescription>
            {"The physical or virtual card — we only ever keep the last four digits."}
          </SheetDescription>
        </SheetHeader>

        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            <div className="space-y-1.5">
              <Label htmlFor="card-account" className="text-[13px]">
                Account
              </Label>
              <NativeSelect
                id="card-account"
                name="accountId"
                defaultValue={defaultAccount?.id}
                className="w-full"
              >
                {accounts.map((account) => (
                  <NativeSelectOption key={account.id} value={account.id}>
                    {account.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
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
                <NativeSelect
                  id="card-brand"
                  name="brand"
                  defaultValue=""
                  className="w-full"
                >
                  <NativeSelectOption value="">—</NativeSelectOption>
                  {CARD_BRANDS.map((brand) => (
                    <NativeSelectOption key={brand.value} value={brand.value}>
                      {brand.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
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
                <span className="text-muted-foreground"> · optional</span>
              </Label>
              <Input id="card-expires" name="expires" type="month" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px]">Color</Label>
              <input type="hidden" name="color" value={color} />
              <div className="flex gap-2">
                {APEX_COLORS.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    aria-label={`Color ${swatch}`}
                    aria-pressed={color === swatch}
                    onClick={() => setColor(swatch)}
                    className={cn(
                      "size-6 rounded-full border-2 transition-transform",
                      color === swatch
                        ? "scale-110 border-foreground"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
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
