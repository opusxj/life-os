"use client"

import * as React from "react"

import { FormError } from "@/components/shared/form-error"
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
import {
  createMortgage,
  updateMortgage,
  type MortgageFormState,
} from "@/lib/apex/mortgage/actions"
import type { Mortgage } from "@/lib/apex/mortgage/queries"

const RATE_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "variable", label: "Variable" },
  { value: "tracker", label: "Tracker" },
] as const

const RATE_TYPE_ITEMS = Object.fromEntries(
  RATE_TYPES.map((type) => [type.value, type.label])
)

/** Add/edit drawer — pass `mortgage` to edit, omit to create. */
export function MortgageDrawer({
  open,
  onOpenChange,
  mortgage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mortgage?: Mortgage
}) {
  const editing = mortgage !== undefined
  const [state, action, pending] = React.useActionState<
    MortgageFormState,
    FormData
  >(async (prev, formData) => {
    const result = editing
      ? await updateMortgage(prev, formData)
      : await createMortgage(prev, formData)
    if (result?.success) onOpenChange(false)
    return result
  }, undefined)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit mortgage" : "Add mortgage"}</SheetTitle>
          <SheetDescription className="text-[13px]">
            {editing
              ? `Updating ${mortgage.name}. Staircased? Change the equity share here.`
              : `The property, the deal and what it costs monthly.`}
          </SheetDescription>
        </SheetHeader>

        <form
          action={action}
          className="flex min-h-0 flex-1 flex-col"
          key={mortgage?.id ?? "new"}
        >
          {editing && <input type="hidden" name="id" value={mortgage.id} />}

          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 pt-1">
            <FieldPair>
              <FormField label="Name" name="name">
                <Input
                  id="mortgage-name"
                  name="name"
                  placeholder="12 Maple Close"
                  defaultValue={mortgage?.name}
                  maxLength={80}
                  required
                />
              </FormField>
              <FormField label="Lender" name="lender">
                <Input
                  id="mortgage-lender"
                  name="lender"
                  placeholder="Halifax"
                  defaultValue={mortgage?.lender}
                  required
                />
              </FormField>
            </FieldPair>

            <FieldPair>
              <FormField label="Original amount £" name="originalAmount">
                <Input
                  id="mortgage-originalAmount"
                  name="originalAmount"
                  inputMode="decimal"
                  placeholder="150,000"
                  defaultValue={pounds(mortgage?.originalAmount)}
                  required
                />
              </FormField>
              <FormField label="Current balance £" name="balance">
                <Input
                  id="mortgage-balance"
                  name="balance"
                  inputMode="decimal"
                  placeholder="142,350"
                  defaultValue={pounds(mortgage?.balance)}
                  required
                />
              </FormField>
            </FieldPair>

            <FieldPair>
              <FormField label="Interest rate %" name="interestRate">
                <Input
                  id="mortgage-interestRate"
                  name="interestRate"
                  inputMode="decimal"
                  placeholder="4.79"
                  defaultValue={mortgage?.interestRate}
                  required
                />
              </FormField>
              <FormField label="Rate type" name="rateType">
                <RateTypeField defaultValue={mortgage?.rateType ?? "fixed"} />
              </FormField>
            </FieldPair>

            <FieldPair>
              <FormField label="Monthly payment £" name="monthlyPayment">
                <Input
                  id="mortgage-monthlyPayment"
                  name="monthlyPayment"
                  inputMode="decimal"
                  placeholder="812.40"
                  defaultValue={pounds(mortgage?.monthlyPayment)}
                  required
                />
              </FormField>
              <FormField label="Term ends" name="termEndsOn">
                <Input
                  id="mortgage-termEndsOn"
                  name="termEndsOn"
                  type="date"
                  defaultValue={mortgage?.termEndsOn}
                  required
                />
              </FormField>
            </FieldPair>

            <p className="pt-1 text-[11px] font-medium tracking-wide text-muted-foreground">
              Optional
            </p>

            <FieldPair>
              <FormField label="Rate ends" name="rateEndsOn">
                <Input
                  id="mortgage-rateEndsOn"
                  name="rateEndsOn"
                  type="date"
                  defaultValue={mortgage?.rateEndsOn ?? undefined}
                />
              </FormField>
              <FormField label="Property value £" name="propertyValue">
                <Input
                  id="mortgage-propertyValue"
                  name="propertyValue"
                  inputMode="decimal"
                  placeholder="310,000"
                  defaultValue={pounds(mortgage?.propertyValue)}
                />
              </FormField>
            </FieldPair>

            <FieldPair>
              <FormField label="Equity share %" name="equitySharePct">
                <Input
                  id="mortgage-equitySharePct"
                  name="equitySharePct"
                  inputMode="decimal"
                  placeholder="50"
                  defaultValue={mortgage?.equitySharePct ?? undefined}
                />
              </FormField>
              <FormField label="Monthly rent £" name="rentMonthly">
                <Input
                  id="mortgage-rentMonthly"
                  name="rentMonthly"
                  inputMode="decimal"
                  placeholder="318.75"
                  defaultValue={pounds(mortgage?.rentMonthly)}
                />
              </FormField>
            </FieldPair>

            <FieldPair>
              {/* The deal's own early-repayment-charge cap; the Overpaying
                  card hedges to the 10% norm until this is filled in. */}
              <FormField
                label="Overpayment cap % a year"
                name="overpaymentAllowancePct"
              >
                <Input
                  id="mortgage-overpaymentAllowancePct"
                  name="overpaymentAllowancePct"
                  inputMode="decimal"
                  placeholder="10"
                  defaultValue={mortgage?.overpaymentAllowancePct ?? undefined}
                />
              </FormField>
            </FieldPair>

            <FormError>{state?.error}</FormError>
          </div>

          <SheetFooter className="flex-row justify-end border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Add mortgage"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function FieldPair({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2.5">{children}</div>
}

/** Controlled Select serialized through a hidden input; lives inside the keyed
 *  form so a mortgage switch remounts it, resetting to `defaultValue` exactly
 *  like the native select it replaced. */
function RateTypeField({ defaultValue }: { defaultValue: string }) {
  const [rateType, setRateType] = React.useState(defaultValue)
  return (
    <>
      <input type="hidden" name="rateType" value={rateType} />
      <Select
        items={RATE_TYPE_ITEMS}
        value={rateType}
        onValueChange={(value) => setRateType(value as string)}
      >
        <SelectTrigger id="mortgage-rateType" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RATE_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

function FormField({
  label,
  name,
  children,
}: {
  label: string
  name: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`mortgage-${name}`} className="text-[13px]">
        {label}
      </Label>
      {children}
    </div>
  )
}

/** Pence → a plain pounds string for input defaults; undefined stays empty. */
function pounds(pence: number | null | undefined): string | undefined {
  if (pence === null || pence === undefined) return undefined
  return (pence / 100).toFixed(2).replace(/\.00$/, "")
}
