import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CalendarSync } from "lucide-react"

import { todayKey } from "@/components/apex/due-state"
import { AddRecurringButton } from "@/components/apex/subscriptions/add-recurring-button"
import { DueNextCard } from "@/components/apex/subscriptions/due-next-card"
import { MonthsAheadCard } from "@/components/apex/subscriptions/months-ahead-card"
import { OutgoingsCard } from "@/components/apex/subscriptions/outgoings-card"
import { RecurringTable } from "@/components/apex/subscriptions/recurring-table"
import { SubscriptionCostsCard } from "@/components/apex/subscriptions/subscription-costs-card"
import { ApexPage, ApexPageHeader } from "@/components/apex/page"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  annualPence,
  getRecurringLastPaid,
  getSubscriptionsPageData,
  monthlyPence,
} from "@/lib/apex/subscriptions/queries"
import { getWorkspace } from "@/lib/data/workspace"

export const metadata: Metadata = {
  title: "Subscriptions & Bills · Apex · Life OS",
}

export default async function SubscriptionsPage() {
  const workspace = await getWorkspace()
  if (!workspace) redirect("/sign-in")

  const spaceId = workspace.activeSpace.id
  const [{ payments, accounts, categories }, lastPaidByPaymentId] =
    await Promise.all([
      getSubscriptionsPageData(spaceId),
      getRecurringLastPaid(spaceId),
    ])
  const today = todayKey()
  const billsMonthly = payments
    .filter((payment) => payment.kind === "bill")
    .reduce((sum, payment) => sum + monthlyPence(payment.amount, payment.cadence), 0)
  const subscriptionsMonthly = payments
    .filter((payment) => payment.kind === "subscription")
    .reduce((sum, payment) => sum + monthlyPence(payment.amount, payment.cadence), 0)
  const annualTotal = payments.reduce(
    (sum, payment) => sum + annualPence(payment.amount, payment.cadence),
    0
  )
  const rows = payments.map((payment) => ({
    ...payment,
    monthly: monthlyPence(payment.amount, payment.cadence),
  }))

  const addButton = (
    <AddRecurringButton
      spaceId={spaceId}
      accounts={accounts}
      categories={categories}
    />
  )

  return (
    <ApexPage>
      <ApexPageHeader title="Subscriptions & Bills" count={payments.length}>
        {addButton}
      </ApexPageHeader>

      {payments.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarSync />
            </EmptyMedia>
            <EmptyTitle>Nothing recurring yet</EmptyTitle>
            <EmptyDescription>
              {
                "Add what leaves the account each month, and the due dates line up below."
              }
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{addButton}</EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <OutgoingsCard
              billsMonthly={billsMonthly}
              subscriptionsMonthly={subscriptionsMonthly}
              annualTotal={annualTotal}
            />
            <DueNextCard payments={payments} today={today} />
            <SubscriptionCostsCard payments={payments} />
          </div>

          <MonthsAheadCard payments={payments} today={today} />

          <RecurringTable
            payments={rows}
            monthlyTotal={billsMonthly + subscriptionsMonthly}
            lastPaid={lastPaidByPaymentId}
            accounts={accounts}
            categories={categories}
            spaceId={spaceId}
            today={today}
          />
        </>
      )}
    </ApexPage>
  )
}
