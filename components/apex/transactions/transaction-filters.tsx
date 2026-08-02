"use client"

import { useRouter } from "next/navigation"
import { ListFilter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
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

const KINDS = [
  ["income", "Income"],
  ["expense", "Expense"],
  ["transfer", "Transfer"],
  ["adjustment", "Adjustment"],
] as const

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

  const isFiltered = Boolean(
    filters.account ||
      filters.card ||
      filters.category ||
      filters.kind ||
      filters.month !== defaultMonth
  )

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
  const kindItems = {
    all: "All kinds",
    ...Object.fromEntries(KINDS),
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ListFilter
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground"
      />

      <Select
        items={monthItems}
        value={filters.month ?? "all"}
        onValueChange={(value) =>
          apply({ month: value === "all" ? undefined : (value as string) })
        }
      >
        <SelectTrigger size="sm" aria-label="Filter by month">
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

      <Select
        items={accountItems}
        value={filters.account ?? "all"}
        onValueChange={(value) =>
          apply({ account: value === "all" ? undefined : (value as string) })
        }
      >
        <SelectTrigger size="sm" aria-label="Filter by account">
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

      {options.cards.length > 0 && (
        <Select
          items={cardItems}
          value={filters.card ?? "all"}
          onValueChange={(value) =>
            apply({ card: value === "all" ? undefined : (value as string) })
          }
        >
          <SelectTrigger size="sm" aria-label="Filter by card">
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
      )}

      <Select
        items={categoryItems}
        value={filters.category ?? "all"}
        onValueChange={(value) =>
          apply({ category: value === "all" ? undefined : (value as string) })
        }
      >
        <SelectTrigger size="sm" aria-label="Filter by category">
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

      <Select
        items={kindItems}
        value={filters.kind ?? "all"}
        onValueChange={(value) =>
          apply({
            kind:
              value === "all"
                ? undefined
                : (value as TransactionFilters["kind"]),
          })
        }
      >
        <SelectTrigger size="sm" aria-label="Filter by kind">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All kinds</SelectItem>
          {KINDS.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isFiltered && (
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground"
          onClick={() =>
            router.replace("/apex/transactions", { scroll: false })
          }
        >
          <X data-icon="inline-start" />
          Clear
        </Button>
      )}
    </div>
  )
}

const MONTH_FORMAT = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
})

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number)
  return MONTH_FORMAT.format(new Date(Date.UTC(year, monthNumber - 1, 1)))
}
