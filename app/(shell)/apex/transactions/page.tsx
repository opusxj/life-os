import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ApexPage, ApexPageHeader } from "@/components/apex/page"
import { AddTransactionDrawer } from "@/components/apex/transactions/transaction-drawer"
import { TransactionsCard } from "@/components/apex/transactions/transactions-table"
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
    <ApexPage>
      <ApexPageHeader title="Transactions">
        <AddTransactionDrawer spaceId={spaceId} options={options} />
      </ApexPageHeader>
      <TransactionsCard
        spaceId={spaceId}
        options={options}
        filters={filters}
        defaultMonth={defaultMonth}
        rows={rows}
        filtered={filtered}
      />
    </ApexPage>
  )
}
