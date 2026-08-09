"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, MotionConfig } from "motion/react"
import { Plus } from "lucide-react"

import { ROW_ICONS } from "@/components/apex/entity-avatar"
import { FormError } from "@/components/shared/form-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { dayKeyAgo, todayKey } from "@/lib/apex/dates"
import { parsePoundsToPence } from "@/lib/apex/money"
import {
  createTransaction,
  updateTransaction,
  type TransactionFormState,
} from "@/lib/apex/transactions/actions"
import type {
  CategoryOption,
  TransactionOptions,
  TransactionRow,
} from "@/lib/apex/transactions/queries"
import { HOUSE_SPRING } from "@/lib/motion"
import { cn } from "@/lib/utils"

type EntryKind = "income" | "expense" | "transfer"

/** Sentinel for the optional "None" choices — Base UI Select item values must
 *  be real strings; the hidden inputs map it back to "" for FormData. */
const NONE = "none"

/** The selected segment takes the colour of the thing being logged. */
const KIND_TINT: Record<EntryKind, string> = {
  expense:
    "aria-pressed:bg-rose-500/12 aria-pressed:text-rose-600 dark:aria-pressed:text-rose-400",
  income:
    "aria-pressed:bg-emerald-500/12 aria-pressed:text-emerald-600 dark:aria-pressed:text-emerald-400",
  transfer:
    "aria-pressed:bg-sky-500/12 aria-pressed:text-sky-600 dark:aria-pressed:text-sky-400",
}

/** Header/empty-state CTA owning its own dialog instance. */
export function AddTransactionDialog({
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
      <TransactionDialog
        open={open}
        onOpenChange={setOpen}
        spaceId={spaceId}
        options={options}
      />
    </>
  )
}

export function TransactionDialog({
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
  /** When set, the dialog edits this transaction instead of creating one */
  transaction?: TransactionRow
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[calc(100svh-4rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-5 py-3">
          <DialogTitle>
            {transaction ? "Edit transaction" : "Add transaction"}
          </DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so state resets on every open */}
        <TransactionForm
          spaceId={spaceId}
          options={options}
          transaction={transaction}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
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
  const [occurredOn, setOccurredOn] = React.useState(
    transaction?.occurredOn ?? todayKey()
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
  const amountInvalid = amount.trim() !== "" && (pence === null || pence <= 0)

  const isTransfer = kind === "transfer"
  const categories = options.categories.filter(
    (category) => category.kind === kind
  )
  const cards = options.cards.filter((card) => card.accountId === accountId)
  const destinations = options.accounts.filter(
    (account) => account.id !== accountId
  )

  // Defaults for the dependent controls; recomputed when their `key` remounts
  // them (account or kind change), exactly like the native defaultValues did.
  const destinationDefault =
    transaction?.transferAccountId &&
    transaction.transferAccountId !== accountId
      ? transaction.transferAccountId
      : (destinations[0]?.id ?? "")
  const categoryDefault =
    transaction?.kind === kind ? (transaction.categoryId ?? "") : ""
  const cardDefault =
    transaction?.accountId === accountId ? (transaction.cardId ?? NONE) : NONE

  const accountItems = Object.fromEntries(
    options.accounts.map((account) => [account.id, account.name])
  )
  const destinationItems = Object.fromEntries(
    destinations.map((account) => [account.id, account.name])
  )
  const cardItems = {
    [NONE]: "None",
    ...Object.fromEntries(
      cards.map((card) => [
        card.id,
        card.last4 ? `${card.name} ·${card.last4}` : card.name,
      ])
    ),
  }

  // The second column of the account row: where the money goes, or which card
  // it left on. Neither exists for a card-less expense, so it spans instead.
  const hasSecondary = isTransfer || cards.length > 0

  return (
    <form action={action} className="flex min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <input type="hidden" name="spaceId" value={spaceId} />
        <input type="hidden" name="kind" value={kind} />
        {transaction && (
          <input type="hidden" name="transactionId" value={transaction.id} />
        )}

        <ToggleGroup
          aria-label="Kind"
          value={[kind]}
          onValueChange={(value) => {
            if (value.length > 0) setKind(value[0] as EntryKind)
          }}
          variant="outline"
          spacing={0}
          className="w-full"
        >
          {(["expense", "income", "transfer"] as const).map((entryKind) => (
            <ToggleGroupItem
              key={entryKind}
              value={entryKind}
              className={cn("h-9 flex-1 capitalize", KIND_TINT[entryKind])}
            >
              {entryKind}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="space-y-1.5">
          <Label htmlFor="txn-amount" className="sr-only">
            Amount
          </Label>
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border bg-muted/40 px-4 py-3 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
              amountInvalid &&
                "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
            )}
          >
            <span className="text-3xl leading-none font-medium text-muted-foreground">
              £
            </span>
            <input
              id="txn-amount"
              name="amount"
              autoFocus
              autoComplete="off"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-invalid={amountInvalid || undefined}
              required
              className="w-full bg-transparent text-3xl leading-none font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          {amountInvalid && (
            <p role="alert" className="text-[13px] text-destructive">
              Enter a valid amount, like 12.50.
            </p>
          )}
        </div>

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

        <div className={cn("grid gap-3", hasSecondary && "sm:grid-cols-2")}>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="txn-account">
              {isTransfer ? "From account" : "Account"}
            </FieldLabel>
            <input type="hidden" name="accountId" value={accountId} />
            <Select
              items={accountItems}
              value={accountId}
              onValueChange={(value) => setAccountId(value as string)}
            >
              <SelectTrigger id="txn-account" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isTransfer && (
            <div className="space-y-1.5">
              <FieldLabel htmlFor="txn-destination">To account</FieldLabel>
              <FormSelect
                key={accountId}
                id="txn-destination"
                name="transferAccountId"
                defaultValue={destinationDefault}
                items={destinationItems}
              >
                {destinations.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </FormSelect>
            </div>
          )}

          {!isTransfer && cards.length > 0 && (
            <div className="space-y-1.5">
              <FieldLabel htmlFor="txn-card">Card</FieldLabel>
              <FormSelect
                key={accountId}
                id="txn-card"
                name="cardId"
                defaultValue={cardDefault}
                items={cardItems}
              >
                <SelectItem value={NONE}>None</SelectItem>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.last4 ? `${card.name} ·${card.last4}` : card.name}
                  </SelectItem>
                ))}
              </FormSelect>
            </div>
          )}
        </div>

        {!isTransfer && categories.length > 0 && (
          <div className="space-y-1.5">
            <FieldLabel>Category</FieldLabel>
            <CategoryChips
              key={kind}
              name="categoryId"
              defaultValue={categoryDefault}
              categories={categories}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <FieldLabel htmlFor="txn-date">Date</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="txn-date"
              name="occurredOn"
              type="date"
              value={occurredOn}
              onChange={(event) => setOccurredOn(event.target.value)}
              className="w-auto"
              required
            />
            <DayChip
              label="Today"
              day={todayKey()}
              value={occurredOn}
              onPick={setOccurredOn}
            />
            <DayChip
              label="Yesterday"
              day={dayKeyAgo(1)}
              value={occurredOn}
              onPick={setOccurredOn}
            />
          </div>
        </div>

        <FormError>{state?.error}</FormError>
      </div>

      <DialogFooter className="m-0 shrink-0 flex-row justify-end rounded-none border-t bg-muted/50 px-5 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
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
      </DialogFooter>
    </form>
  )
}

/**
 * Categories as their own swatch colours rather than a dropdown — the whole
 * set is visible at a glance and one tap picks it. Clicking the selected chip
 * clears it, which is how "no category" is expressed.
 */
function CategoryChips({
  name,
  defaultValue,
  categories,
}: {
  name: string
  defaultValue: string
  categories: CategoryOption[]
}) {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <MotionConfig reducedMotion="user">
        <div
          role="group"
          aria-label="Category"
          className="flex flex-wrap gap-1.5"
        >
          {categories.map((category) => {
            const selected = value === category.id
            const Icon = category.icon ? ROW_ICONS[category.icon] : undefined
            return (
              <motion.button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setValue(selected ? "" : category.id)}
                whileTap={{ scale: 0.96 }}
                transition={HOUSE_SPRING}
                style={
                  {
                    "--chip-bg": `color-mix(in srgb, ${category.color} 18%, transparent)`,
                    "--chip-mark": `color-mix(in srgb, ${category.color} 65%, var(--color-foreground))`,
                  } as React.CSSProperties
                }
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[13px] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-transparent bg-(--chip-bg) font-medium text-foreground"
                    : "border-input text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {Icon ? (
                  <Icon
                    aria-hidden
                    className="size-3.5 shrink-0 text-(--chip-mark)"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full bg-(--chip-mark)"
                  />
                )}
                {category.name}
              </motion.button>
            )
          })}
        </div>
      </MotionConfig>
    </>
  )
}

/** "Today"/"Yesterday" next to the date field — the two dates people actually log. */
function DayChip({
  label,
  day,
  value,
  onPick,
}: {
  label: string
  day: string
  value: string
  onPick: (day: string) => void
}) {
  return (
    <Button
      type="button"
      variant={value === day ? "secondary" : "ghost"}
      size="sm"
      aria-pressed={value === day}
      onClick={() => onPick(day)}
      className="text-[13px]"
    >
      {label}
    </Button>
  )
}

/**
 * Controlled Select serialized through a hidden input (Base UI's own form
 * serialization is not relied on). Parents reset it exactly like the native
 * selects it replaced: a `key` change or conditional remount re-initializes
 * state from `defaultValue`. NONE maps back to "" for FormData.
 */
function FormSelect({
  id,
  name,
  defaultValue,
  items,
  children,
}: {
  id: string
  name: string
  defaultValue: string
  items: Record<string, React.ReactNode>
  children: React.ReactNode
}) {
  const [value, setValue] = React.useState(defaultValue)
  return (
    <>
      <input type="hidden" name={name} value={value === NONE ? "" : value} />
      <Select
        items={items}
        value={value}
        onValueChange={(next) => setValue(next as string)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </>
  )
}

function FieldLabel(props: React.ComponentProps<typeof Label>) {
  return (
    <Label
      {...props}
      className="text-[13px] font-medium text-muted-foreground"
    />
  )
}
