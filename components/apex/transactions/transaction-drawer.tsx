"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { parsePoundsToPence } from "@/lib/apex/money"
import {
  createTransaction,
  updateTransaction,
  type TransactionFormState,
} from "@/lib/apex/transactions/actions"
import type {
  TransactionOptions,
  TransactionRow,
} from "@/lib/apex/transactions/queries"

type EntryKind = "income" | "expense" | "transfer"

/** Header/empty-state CTA owning its own drawer instance. */
export function AddTransactionDrawer({
  spaceId,
  options,
}: {
  spaceId: string
  options: TransactionOptions
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Add transaction
      </Button>
      <TransactionDrawer
        open={open}
        onOpenChange={setOpen}
        spaceId={spaceId}
        options={options}
      />
    </>
  )
}

export function TransactionDrawer({
  open,
  onOpenChange,
  spaceId,
  options,
  transaction,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaceId: string
  options: TransactionOptions
  /** When set, the drawer edits this transaction instead of creating one */
  transaction?: TransactionRow
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent>
        <DrawerHeader className="pb-3">
          <DrawerTitle>
            {transaction ? "Edit transaction" : "Add transaction"}
          </DrawerTitle>
        </DrawerHeader>
        {/* Mounted only while open, so state resets on every open */}
        <TransactionForm
          spaceId={spaceId}
          options={options}
          transaction={transaction}
          onDone={() => onOpenChange(false)}
        />
      </DrawerContent>
    </Drawer>
  )
}

function TransactionForm({
  spaceId,
  options,
  transaction,
  onDone,
}: {
  spaceId: string
  options: TransactionOptions
  transaction?: TransactionRow
  onDone: () => void
}) {
  const router = useRouter()
  const isEdit = Boolean(transaction)

  const [kind, setKind] = React.useState<EntryKind>(
    transaction && transaction.kind !== "adjustment"
      ? transaction.kind
      : "expense"
  )
  const [accountId, setAccountId] = React.useState(
    transaction?.accountId ?? options.accounts[0]?.id ?? ""
  )
  const [amount, setAmount] = React.useState(
    transaction ? (transaction.amount / 100).toFixed(2) : ""
  )

  const [state, action, pending] = React.useActionState<
    TransactionFormState,
    FormData
  >(async (prev, formData) => {
    const submit = isEdit ? updateTransaction : createTransaction
    const result = await submit(prev, formData)
    if (result?.success) {
      onDone()
      router.refresh()
    }
    return result
  }, undefined)

  const pence = parsePoundsToPence(amount)
  const amountInvalid =
    amount.trim() !== "" && (pence === null || pence <= 0)

  const isTransfer = kind === "transfer"
  const categories = options.categories.filter(
    (category) => category.kind === kind
  )
  const cards = options.cards.filter((card) => card.accountId === accountId)
  const destinations = options.accounts.filter(
    (account) => account.id !== accountId
  )

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-1">
        <input type="hidden" name="spaceId" value={spaceId} />
        <input type="hidden" name="kind" value={kind} />
        {transaction && (
          <input type="hidden" name="transactionId" value={transaction.id} />
        )}

        <div className="space-y-1.5">
          <FieldLabel htmlFor="txn-amount">Amount</FieldLabel>
          <Input
            id="txn-amount"
            name="amount"
            autoFocus
            autoComplete="off"
            inputMode="decimal"
            placeholder="£0.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={amountInvalid || undefined}
            required
          />
          {amountInvalid && (
            <p role="alert" className="text-[11px] text-destructive">
              Enter a valid amount, like 12.50.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Kind</FieldLabel>
          <ToggleGroup
            aria-label="Kind"
            value={[kind]}
            onValueChange={(value) => {
              if (value.length > 0) setKind(value[0] as EntryKind)
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="w-full"
          >
            <ToggleGroupItem value="expense" className="flex-1 text-[13px]">
              Expense
            </ToggleGroupItem>
            <ToggleGroupItem value="income" className="flex-1 text-[13px]">
              Income
            </ToggleGroupItem>
            <ToggleGroupItem value="transfer" className="flex-1 text-[13px]">
              Transfer
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="txn-account">
            {isTransfer ? "From account" : "Account"}
          </FieldLabel>
          <NativeSelect
            className="w-full"
            id="txn-account"
            name="accountId"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            required
          >
            {options.accounts.map((account) => (
              <NativeSelectOption key={account.id} value={account.id}>
                {account.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {isTransfer && (
          <div className="space-y-1.5">
            <FieldLabel htmlFor="txn-destination">To account</FieldLabel>
            <NativeSelect
              className="w-full"
              key={accountId}
              id="txn-destination"
              name="transferAccountId"
              defaultValue={
                transaction?.transferAccountId &&
                transaction.transferAccountId !== accountId
                  ? transaction.transferAccountId
                  : (destinations[0]?.id ?? "")
              }
              required
            >
              {destinations.map((account) => (
                <NativeSelectOption key={account.id} value={account.id}>
                  {account.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}

        <div className="space-y-1.5">
          <FieldLabel htmlFor="txn-description">Description</FieldLabel>
          <Input
            id="txn-description"
            name="description"
            placeholder={isTransfer ? "Savings top up" : "Tesco, salary…"}
            defaultValue={transaction?.description ?? ""}
            maxLength={120}
            required
          />
        </div>

        {!isTransfer && (
          <div className="space-y-1.5">
            <FieldLabel htmlFor="txn-category">Category</FieldLabel>
            <NativeSelect
              className="w-full"
              key={kind}
              id="txn-category"
              name="categoryId"
              defaultValue={
                transaction?.kind === kind ? (transaction?.categoryId ?? "") : ""
              }
            >
              <NativeSelectOption value="">None</NativeSelectOption>
              {categories.map((category) => (
                <NativeSelectOption key={category.id} value={category.id}>
                  {category.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}

        {!isTransfer && cards.length > 0 && (
          <div className="space-y-1.5">
            <FieldLabel htmlFor="txn-card">Card</FieldLabel>
            <NativeSelect
              className="w-full"
              key={accountId}
              id="txn-card"
              name="cardId"
              defaultValue={
                transaction?.accountId === accountId
                  ? (transaction?.cardId ?? "")
                  : ""
              }
            >
              <NativeSelectOption value="">None</NativeSelectOption>
              {cards.map((card) => (
                <NativeSelectOption key={card.id} value={card.id}>
                  {card.last4 ? `${card.name} ·${card.last4}` : card.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}

        <div className="space-y-1.5">
          <FieldLabel htmlFor="txn-date">Date</FieldLabel>
          <Input
            id="txn-date"
            name="occurredOn"
            type="date"
            defaultValue={transaction?.occurredOn ?? localToday()}
            required
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

      <DrawerFooter className="flex-row justify-end pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDone}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending || amountInvalid}>
          {pending
            ? isEdit
              ? "Saving…"
              : "Adding…"
            : isEdit
              ? "Save changes"
              : "Add transaction"}
        </Button>
      </DrawerFooter>
    </form>
  )
}

function FieldLabel(props: React.ComponentProps<typeof Label>) {
  return (
    <Label
      {...props}
      className="text-[11px] font-medium text-muted-foreground"
    />
  )
}

function localToday(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}
