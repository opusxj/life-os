"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"

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
 * Filters live inline with the page title: the kinds people switch between
 * constantly as tabs, everything else folded into a popover that shows how
 * many are on.
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

  // Every change rebuilds the full query string from the merged filter state;
  // default month is kept out of the URL, all-time is the explicit `month=all`.
  function apply(next: Partial<TransactionFilters>) {
    const merged = { ...filters, ...next }
    const params = new URLSearchParams()
    if (merged.account) params.set("account", merged.account)
    if (merged.card) params.set("card", merged.card)
    if (merged.category) params.set("category", merged.category)
    if (merged.kind) params.set("kind", merged.kind)
    if (merged.month === undefined) params.set("month", "all")
    else if (merged.month !== defaultMonth) params.set("month", merged.month)
    const query = params.toString()
    router.replace(
      query ? `/apex/transactions?${query}` : "/apex/transactions",
      { scroll: false }
    )
  }

  const months =
    filters.month && !options.months.includes(filters.month)
      ? [filters.month, ...options.months]
      : options.months

  // The kind tabs carry themselves; the badge counts only what's hidden.
  const refinedCount = [
    filters.account,
    filters.card,
    filters.category,
    filters.month !== defaultMonth ? "month" : undefined,
  ].filter(Boolean).length

  const expenseCategories = options.categories.filter(
    (category) => category.kind === "expense"
  )
  const incomeCategories = options.categories.filter(
    (category) => category.kind === "income"
  )

  const monthItems = {
    ...Object.fromEntries(months.map((month) => [month, formatMonth(month)])),
    all: "All time",
  }
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
          <FilterField label="Month">
            <Select
              items={monthItems}
              value={filters.month ?? "all"}
              onValueChange={(value) =>
                apply({
                  month: value === "all" ? undefined : (value as string),
                })
              }
            >
              <SelectTrigger size="sm" className="w-full">
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
          </FilterField>

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
                  month: defaultMonth,
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
