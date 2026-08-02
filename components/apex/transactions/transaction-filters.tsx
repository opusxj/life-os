"use client"

import { useRouter } from "next/navigation"
import { ListFilter, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/components/ui/native-select"
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ListFilter
        aria-hidden
        className="size-4 shrink-0 text-muted-foreground"
      />
      <NativeSelect
        size="sm"
        aria-label="Filter by month"
        value={filters.month ?? "all"}
        onChange={(event) =>
          apply({
            month:
              event.target.value === "all" ? undefined : event.target.value,
          })
        }
      >
        {months.map((month) => (
          <NativeSelectOption key={month} value={month}>
            {formatMonth(month)}
          </NativeSelectOption>
        ))}
        <NativeSelectOption value="all">All time</NativeSelectOption>
      </NativeSelect>

      <NativeSelect
        size="sm"
        aria-label="Filter by account"
        value={filters.account ?? "all"}
        onChange={(event) =>
          apply({
            account:
              event.target.value === "all" ? undefined : event.target.value,
          })
        }
      >
        <NativeSelectOption value="all">All accounts</NativeSelectOption>
        {options.accounts.map((account) => (
          <NativeSelectOption key={account.id} value={account.id}>
            {account.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      {options.cards.length > 0 && (
        <NativeSelect
          size="sm"
          aria-label="Filter by card"
          value={filters.card ?? "all"}
          onChange={(event) =>
            apply({
              card:
                event.target.value === "all" ? undefined : event.target.value,
            })
          }
        >
          <NativeSelectOption value="all">All cards</NativeSelectOption>
          {options.cards.map((card) => (
            <NativeSelectOption key={card.id} value={card.id}>
              {card.last4 ? `${card.name} ·${card.last4}` : card.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}

      <NativeSelect
        size="sm"
        aria-label="Filter by category"
        value={filters.category ?? "all"}
        onChange={(event) =>
          apply({
            category:
              event.target.value === "all" ? undefined : event.target.value,
          })
        }
      >
        <NativeSelectOption value="all">All categories</NativeSelectOption>
        <NativeSelectOptGroup label="Expense">
          {expenseCategories.map((category) => (
            <NativeSelectOption key={category.id} value={category.id}>
              {category.name}
            </NativeSelectOption>
          ))}
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="Income">
          {incomeCategories.map((category) => (
            <NativeSelectOption key={category.id} value={category.id}>
              {category.name}
            </NativeSelectOption>
          ))}
        </NativeSelectOptGroup>
      </NativeSelect>

      <NativeSelect
        size="sm"
        aria-label="Filter by kind"
        value={filters.kind ?? "all"}
        onChange={(event) =>
          apply({
            kind:
              event.target.value === "all"
                ? undefined
                : (event.target.value as TransactionFilters["kind"]),
          })
        }
      >
        <NativeSelectOption value="all">All kinds</NativeSelectOption>
        {KINDS.map(([value, label]) => (
          <NativeSelectOption key={value} value={value}>
            {label}
          </NativeSelectOption>
        ))}
      </NativeSelect>

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
