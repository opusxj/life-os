"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { ACCOUNT_KINDS, APEX_COLORS } from "@/components/apex/accounts/meta"
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
import { saveAccount, type ApexFormState } from "@/lib/apex/accounts/actions"
import type { Account } from "@/lib/apex/accounts/queries"
import { cn } from "@/lib/utils"

const KIND_ITEMS = Object.fromEntries(
  ACCOUNT_KINDS.map((kind) => [kind.value, kind.label])
)

export function AccountFormSheet({
  open,
  onOpenChange,
  spaceId,
  account,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceId: string
  /** Present = edit mode */
  account?: Account
}) {
  const router = useRouter()
  const [color, setColor] = React.useState(account?.color ?? APEX_COLORS[1])
  const [kind, setKind] = React.useState(account?.kind ?? "current")
  const [state, action, pending] = React.useActionState<ApexFormState, FormData>(
    async (prev, formData) => {
      const result = await saveAccount(prev, formData)
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
          <SheetTitle>{account ? "Edit account" : "New account"}</SheetTitle>
          <SheetDescription>
            {account
              ? "Rename, recolor or reclassify."
              : "A real-world account to track."}
          </SheetDescription>
        </SheetHeader>

        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4">
            {account && (
              <input type="hidden" name="accountId" value={account.id} />
            )}
            <input type="hidden" name="spaceId" value={spaceId} />

            <div className="space-y-1.5">
              <Label htmlFor="account-name" className="text-[13px]">
                Name
              </Label>
              <Input
                id="account-name"
                name="name"
                placeholder="Joint Current"
                defaultValue={account?.name}
                maxLength={60}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-kind" className="text-[13px]">
                Type
              </Label>
              <input type="hidden" name="kind" value={kind} />
              <Select
                items={KIND_ITEMS}
                value={kind}
                onValueChange={(value) => setKind(value as string)}
              >
                <SelectTrigger id="account-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_KINDS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-institution" className="text-[13px]">
                Bank / provider
                <span className="text-muted-foreground"> · optional</span>
              </Label>
              <Input
                id="account-institution"
                name="institution"
                placeholder="Monzo"
                defaultValue={account?.institution ?? ""}
                maxLength={60}
              />
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

            {!account && (
              <div className="space-y-1.5">
                <Label htmlFor="account-starting" className="text-[13px]">
                  Starting balance
                  <span className="text-muted-foreground"> · optional</span>
                </Label>
                <MoneyInput
                  id="account-starting"
                  name="startingBalance"
                  placeholder="0.00"
                />
                <p className="text-[11px] text-muted-foreground">
                  Recorded as a balance sync, so history stays honest.
                </p>
              </div>
            )}

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
              {pending
                ? "Saving…"
                : account
                  ? "Save changes"
                  : "Create account"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

export function MoneyInput(props: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[13px] text-muted-foreground">
        £
      </span>
      <Input inputMode="decimal" className="pl-6" {...props} />
    </div>
  )
}
