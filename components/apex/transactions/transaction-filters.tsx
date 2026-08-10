"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  TransactionFilters,
  TransactionOptions,
} from "@/lib/apex/transactions/queries"
import { formatMonthYear } from "@/lib/apex/dates"
import { cn } from "@/lib/utils"

/** The kinds worth one tap. Adjustments are system rows — hence "Sync". */
const KIND_TABS = [
  [undefined, "All"],
  ["income", "Income"],
  ["expense", "Expense"],
  ["transfer", "Transfer"],
  ["adjustment", "Sync"],
] as const

/**
 * Filter state → the URL it lives at. Default month stays out of the query,
 * all-time is the explicit `month=all`; shared by every control that writes
 * filters so they can never disagree on the encoding.
 */
function transactionsUrl(
  merged: TransactionFilters,
  defaultMonth: string
): string {
  const params = new URLSearchParams()
  if (merged.account) params.set("account", merged.account)
  if (merged.card) params.set("card", merged.card)
  if (merged.category) params.set("category", merged.category)
  if (merged.kind) params.set("kind", merged.kind)
  if (merged.month === undefined) params.set("month", "all")
  else if (merged.month !== defaultMonth) params.set("month", merged.month)
  const query = params.toString()
  return query ? `/apex/transactions?${query}` : "/apex/transactions"
}

/**
 * The ledger's primary scope, promoted out of the filter popover: arrows walk
 * a month at a time, the label is a select for far jumps and all time. Bounded
 * by the months transactions actually span, so the far end of an arrow is the
 * edge of the data rather than a warning.
 */
export function MonthStepper({
  options,
  filters,
  defaultMonth,
}: {
  options: TransactionOptions
  filters: TransactionFilters
  defaultMonth: string
}) {
  const router = useRouter()

  function apply(month: string | undefined) {
    router.replace(
      transactionsUrl({ ...filters, month }, defaultMonth),
      { scroll: false }
    )
  }

  // A hand-edited URL can name a month outside the data's span; re-sorting
  // after injection keeps the arrows stepping in calendar order regardless.
  const months = React.useMemo(() => {
    if (!filters.month || options.months.includes(filters.month)) {
      return options.months
    }
    return [...new Set([filters.month, ...options.months])].sort().reverse()
  }, [filters.month, options.months])

  const index = filters.month ? months.indexOf(filters.month) : -1
  const previous = index >= 0 ? months[index + 1] : undefined
  const next = index > 0 ? months[index - 1] : undefined

  const monthItems = {
    ...Object.fromEntries(months.map((month) => [month, formatMonth(month)])),
    all: "All time",
  }

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Previous month"
        disabled={!previous}
        onClick={() => previous && apply(previous)}
      >
        <ChevronLeft />
      </Button>
      <Select
        items={monthItems}
        value={filters.month ?? "all"}
        onValueChange={(value) =>
          apply(value === "all" ? undefined : (value as string))
        }
      >
        <SelectTrigger size="sm" aria-label="Month" className="font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month} value={month}>
              {formatMonth(month)}
            </SelectItem>
          ))}
          <SelectItem value="all">All time</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Next month"
        disabled={!next}
        onClick={() => next && apply(next)}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}

/**
 * Kind tabs plus the refinements popover. The kinds people switch between
 * constantly stay one tap; account, card and category fold away with a badge
 * counting how many are on. The month lives in `MonthStepper`, not here.
 */
export function TransactionFilterBar({
  options,
  filters,
  defaultMonth,
}: {
  options: TransactionOptions
  filters: TransactionFilters
  defaultMonth: string
}) {
  const router = useRouter()

  function apply(next: Partial<TransactionFilters>) {
    router.replace(
      transactionsUrl({ ...filters, ...next }, defaultMonth),
      { scroll: false }
    )
  }

  // The kind tabs carry themselves and the stepper carries the month; the
  // badge counts only what's folded away.
  const refinedCount = [filters.account, filters.card, filters.category].filter(
    Boolean
  ).length

  const expenseCategories = options.categories.filter(
    (category) => category.kind === "expense"
  )
  const incomeCategories = options.categories.filter(
    (category) => category.kind === "income"
  )

  const accountItems = {
    all: "All accounts",
    ...Object.fromEntries(
      options.accounts.map((account) => [account.id, account.name])
    ),
  }
  const cardItems = {
    all: "All cards",
    ...Object.fromEntries(
      options.cards.map((card) => [
        card.id,
        card.last4 ? `${card.name} ·${card.last4}` : card.name,
      ])
    ),
  }
  const categoryItems = {
    all: "All categories",
    ...Object.fromEntries(
      options.categories.map((category) => [category.id, category.name])
    ),
  }

  return (
    <>
      <div className="flex items-center gap-0.5 rounded-full bg-muted/60 p-0.5">
        {KIND_TABS.map(([value, label]) => {
          const active = filters.kind === value
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => apply({ kind: value })}
              className={cn(
                "rounded-full px-2.5 py-1 text-[13px] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                active
                  ? "bg-foreground font-medium text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              aria-label={`Filters${refinedCount > 0 ? ` (${refinedCount} on)` : ""}`}
            />
          }
        >
          <SlidersHorizontal data-icon="inline-start" />
          Filters
          {refinedCount > 0 && (
            <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background tabular-nums">
              {refinedCount}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64">
          <FilterField label="Account">
            <Select
              items={accountItems}
              value={filters.account ?? "all"}
              onValueChange={(value) =>
                apply({
                  account: value === "all" ? undefined : (value as string),
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>
                {options.accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          {options.cards.length > 0 && (
            <FilterField label="Card">
              <Select
                items={cardItems}
                value={filters.card ?? "all"}
                onValueChange={(value) =>
                  apply({
                    card: value === "all" ? undefined : (value as string),
                  })
                }
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cards</SelectItem>
                  {options.cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.last4 ? `${card.name} ·${card.last4}` : card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
          )}

          <FilterField label="Category">
            <Select
              items={categoryItems}
              value={filters.category ?? "all"}
              onValueChange={(value) =>
                apply({
                  category: value === "all" ? undefined : (value as string),
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectGroup>
                  <SelectLabel>Expense</SelectLabel>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Income</SelectLabel>
                  {incomeCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FilterField>

          {refinedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() =>
                apply({
                  account: undefined,
                  card: undefined,
                  category: undefined,
                })
              }
            >
              Reset filters
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </>
  )
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <span className="text-[12px] font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}

/**
 * "2026-08" → "August 2026". A dropdown has room for the month's name, so it
 * gets one. Parsing through the shared vocabulary also fixes a latent shift:
 * a UTC-midnight date formatted in local time lands on the previous month
 * anywhere west of UTC.
 */
function formatMonth(month: string): string {
  return formatMonthYear(`${month}-01`)
}
