import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CalendarSync } from "lucide-react"

import { AddRecurringButton } from "@/components/apex/subscriptions/add-recurring-button"
import { RecurringTable } from "@/components/apex/subscriptions/recurring-table"
import { RecurringStatCard } from "@/components/apex/subscriptions/stat-card"
import {
  ApexCardGrid,
  ApexPage,
  ApexPageHeader,
  ApexSection,
} from "@/components/apex/page"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatPence } from "@/lib/apex/money"
import {
  getSubscriptionsPageData,
  monthlyPence,
} from "@/lib/apex/subscriptions/queries"
import { getWorkspace } from "@/lib/data/workspace"

export const metadata: Metadata = {
  title: "Subscriptions & Bills · Apex · Life OS",
}

const dueDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
})

export default async function SubscriptionsPage() {
  const workspace = await getWorkspace()
  if (!workspace) redirect("/sign-in")

  const { payments, accounts, categories } = await getSubscriptionsPageData(
    workspace.activeSpace.id
  )

  const spaceId = workspace.activeSpace.id
  const today = new Date().toISOString().slice(0, 10)
  const subscriptions = payments.filter((p) => p.kind === "subscription")
  const bills = payments.filter((p) => p.kind === "bill")
  const subscriptionsMonthly = subscriptions.reduce(
    (sum, p) => sum + monthlyPence(p.amount, p.cadence),
    0
  )
  const billsMonthly = bills.reduce(
    (sum, p) => sum + monthlyPence(p.amount, p.cadence),
    0
  )
  // Query is ordered by next_due_on, so the soonest is first
  const nextDue = payments[0]

  const addButton = (
    <AddRecurringButton
      spaceId={spaceId}
      accounts={accounts}
      categories={categories}
    />
  )

  return (
    <ApexPage>
      <ApexPageHeader title="Subscriptions & Bills">{addButton}</ApexPageHeader>

      {payments.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarSync />
            </EmptyMedia>
            <EmptyTitle>Nothing recurring yet</EmptyTitle>
            <EmptyDescription>
              {"Add what leaves the account each month and due dates surface themselves."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{addButton}</EmptyContent>
        </Empty>
      ) : (
        <>
          <ApexCardGrid>
            <RecurringStatCard
              label="Subscriptions / month"
              value={formatPence(subscriptionsMonthly)}
              support={
                subscriptions.length === 1
                  ? `1 active subscription`
                  : `${subscriptions.length} active subscriptions`
              }
            />
            <RecurringStatCard
              label="Bills / month"
              value={formatPence(billsMonthly)}
              support={
                bills.length === 1
                  ? `1 committed bill`
                  : `${bills.length} committed bills`
              }
            />
            <RecurringStatCard
              label="Next due"
              value={nextDue ? formatPence(nextDue.amount) : "—"}
              support={
                nextDue
                  ? `${nextDue.name} · ${dueDateFormat.format(new Date(`${nextDue.nextDueOn}T00:00:00`))}`
                  : `Nothing scheduled`
              }
            />
          </ApexCardGrid>

          <ApexSection label="Subscriptions">
            <RecurringTable
              payments={subscriptions}
              accounts={accounts}
              categories={categories}
              spaceId={spaceId}
              today={today}
              emptyLine="No subscriptions — just the way your wallet likes it."
            />
          </ApexSection>

          <ApexSection label="Bills">
            <RecurringTable
              payments={bills}
              accounts={accounts}
              categories={categories}
              spaceId={spaceId}
              today={today}
              emptyLine="No committed bills tracked yet."
            />
          </ApexSection>
        </>
      )}
    </ApexPage>
  )
}
