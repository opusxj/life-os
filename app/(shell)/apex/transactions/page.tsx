import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { todayKey } from "@/components/apex/due-state"
import { ApexPage, ApexPageHeader } from "@/components/apex/page"
import { AddTransactionDialog } from "@/components/apex/transactions/transaction-dialog"
import { TransactionFilterBar } from "@/components/apex/transactions/transaction-filters"
import {
  TransactionsCard,
  TransactionTotals,
} from "@/components/apex/transactions/transactions-table"
import {
  currentMonth,
  getTransactionOptions,
  getTransactions,
  getTransactionTotals,
  parseTransactionFilters,
} from "@/lib/apex/transactions/queries"
import { getWorkspace } from "@/lib/data/workspace"

export const metadata: Metadata = { title: "Transactions · Apex · Life OS" }

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, workspace] = await Promise.all([searchParams, getWorkspace()])
  if (!workspace) redirect("/sign-in")

  const spaceId = workspace.activeSpace.id
  const filters = parseTransactionFilters(params)
  const [options, rows, totals] = await Promise.all([
    getTransactionOptions(spaceId),
    getTransactions(spaceId, filters),
    getTransactionTotals(spaceId, filters),
  ])

  const defaultMonth = currentMonth()
  const filtered = Boolean(
    filters.account ||
    filters.card ||
    filters.category ||
    filters.kind ||
    filters.month !== defaultMonth
  )

  return (
    // One table and nothing else, so the page takes the body's height and the
    // ledger scrolls inside itself.
    <ApexPage fill>
      <ApexPageHeader
        title="Transactions"
        count={totals.rowCount}
        description={
          totals.rowCount > 0 && <TransactionTotals totals={totals} />
        }
      >
        <TransactionFilterBar
          options={options}
          filters={filters}
          defaultMonth={defaultMonth}
        />
        <AddTransactionDialog spaceId={spaceId} options={options} />
      </ApexPageHeader>
      <TransactionsCard
        spaceId={spaceId}
        options={options}
        rows={rows}
        totals={totals}
        filtered={filtered}
        today={todayKey()}
      />
    </ApexPage>
  )
}
