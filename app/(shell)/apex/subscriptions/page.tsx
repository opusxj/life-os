import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CalendarClock, CalendarSync, ReceiptText, Repeat } from "lucide-react"

import { AddRecurringButton } from "@/components/apex/subscriptions/add-recurring-button"
import { RecurringTable } from "@/components/apex/subscriptions/recurring-table"
import { ApexCardGrid, ApexPage, ApexPageHeader } from "@/components/apex/page"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatValue,
} from "@/components/apex/stat-card"
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
              {
                "Add what leaves the account each month and due dates surface themselves."
              }
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{addButton}</EmptyContent>
        </Empty>
      ) : (
        <>
          <ApexCardGrid>
            <ApexStatCard
              label="Subscriptions / month"
              icon={Repeat}
              iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
            >
              <ApexStatValue>{formatPence(subscriptionsMonthly)}</ApexStatValue>
              <ApexStatHint>
                {subscriptions.length === 1
                  ? `1 active subscription`
                  : `${subscriptions.length} active subscriptions`}
              </ApexStatHint>
            </ApexStatCard>
            <ApexStatCard
              label="Bills / month"
              icon={ReceiptText}
              iconClassName="bg-sky-500/10 text-sky-600 dark:text-sky-400"
            >
              <ApexStatValue>{formatPence(billsMonthly)}</ApexStatValue>
              <ApexStatHint>
                {bills.length === 1
                  ? `1 committed bill`
                  : `${bills.length} committed bills`}
              </ApexStatHint>
            </ApexStatCard>
            <ApexStatCard
              label="Next due"
              icon={CalendarClock}
              iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              <ApexStatValue>
                {nextDue ? formatPence(nextDue.amount) : "—"}
              </ApexStatValue>
              <ApexStatHint className="truncate">
                {nextDue
                  ? `${nextDue.name} · ${dueDateFormat.format(new Date(`${nextDue.nextDueOn}T00:00:00`))}`
                  : `Nothing scheduled`}
              </ApexStatHint>
            </ApexStatCard>
          </ApexCardGrid>

          <RecurringTable
            title="Subscriptions"
            description="Optional recurring spend, soonest due first."
            kind="subscription"
            monthlyTotal={subscriptionsMonthly}
            payments={subscriptions}
            accounts={accounts}
            categories={categories}
            spaceId={spaceId}
            today={today}
            emptyLine="No subscriptions — just the way your wallet likes it."
          />

          <RecurringTable
            title="Bills"
            description="Committed outgoings, soonest due first."
            kind="bill"
            monthlyTotal={billsMonthly}
            payments={bills}
            accounts={accounts}
            categories={categories}
            spaceId={spaceId}
            today={today}
            emptyLine="No committed bills tracked yet."
          />
        </>
      )}
    </ApexPage>
  )
}
