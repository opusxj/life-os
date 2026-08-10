import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { todayKey } from "@/components/apex/due-state"
import { ApexPage } from "@/components/apex/page"
import { CashflowCards } from "@/components/apex/transactions/cashflow-cards"
import { AddTransactionDialog } from "@/components/apex/transactions/transaction-dialog"
import {
  MonthStepper,
  TransactionFilterBar,
} from "@/components/apex/transactions/transaction-filters"
import { TransactionsCard } from "@/components/apex/transactions/transactions-table"
import { MetaDot } from "@/components/shared/meta-dot"
import { formatMonth } from "@/lib/apex/dates"
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
    // Cards and bar stay put; only the ledger scrolls, inside its own card.
    <ApexPage fill>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {/* The cards and the stepper carry the visible naming */}
        <h1 className="sr-only">Transactions</h1>
        <div className="flex flex-wrap items-center gap-2.5">
          <MonthStepper
            options={options}
            filters={filters}
            defaultMonth={defaultMonth}
          />
          <p className="text-[13px] text-muted-foreground tabular-nums">
            {totals.rowCount === 1
              ? "1 transaction"
              : `${totals.rowCount} transactions`}
            {totals.transferCount > 0 && (
              <>
                <MetaDot />
                {totals.transferCount === 1
                  ? "1 transfer"
                  : `${totals.transferCount} transfers`}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TransactionFilterBar
            options={options}
            filters={filters}
            defaultMonth={defaultMonth}
          />
          <AddTransactionDialog spaceId={spaceId} options={options} />
        </div>
      </div>

      {totals.rowCount > 0 && (
        <CashflowCards
          totals={totals}
          monthName={filters.month ? formatMonth(`${filters.month}-01`) : null}
          currentMonth={filters.month === defaultMonth}
        />
      )}

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
