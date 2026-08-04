import type { Metadata } from "next"
import { redirect } from "next/navigation"

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
  const [options, rows] = await Promise.all([
    getTransactionOptions(spaceId),
    getTransactions(spaceId, filters),
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
        count={rows.length}
        description={rows.length > 0 && <TransactionTotals rows={rows} />}
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
        filtered={filtered}
      />
    </ApexPage>
  )
}
