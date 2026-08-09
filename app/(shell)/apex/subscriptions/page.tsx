import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CalendarSync } from "lucide-react"

import { todayKey } from "@/components/apex/due-state"
import { AddRecurringButton } from "@/components/apex/subscriptions/add-recurring-button"
import { DueNextCard } from "@/components/apex/subscriptions/due-next-card"
import { MonthsAheadCard } from "@/components/apex/subscriptions/months-ahead-card"
import { OutgoingsCard } from "@/components/apex/subscriptions/outgoings-card"
import { PriceCreepCard } from "@/components/apex/subscriptions/price-creep-card"
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
  lastPaidFromStamps,
  priceRisers,
} from "@/lib/apex/subscriptions/history"
import {
  annualPence,
  getRecurringPaymentStamps,
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
  const [{ payments, accounts, categories }, stamps] = await Promise.all([
    getSubscriptionsPageData(spaceId),
    getRecurringPaymentStamps(spaceId),
  ])
  const lastPaidByPaymentId = lastPaidFromStamps(stamps)
  const risers = priceRisers(payments, stamps)
  const today = todayKey()
  // Paused items keep their table row but leave every live answer: the cards
  // and the foot state what actually leaves the account right now.
  const active = payments.filter((payment) => !payment.paused)
  const billsMonthly = active
    .filter((payment) => payment.kind === "bill")
    .reduce((sum, payment) => sum + monthlyPence(payment.amount, payment.cadence), 0)
  const subscriptionsMonthly = active
    .filter((payment) => payment.kind === "subscription")
    .reduce((sum, payment) => sum + monthlyPence(payment.amount, payment.cadence), 0)
  const annualTotal = active.reduce(
    (sum, payment) => sum + annualPence(payment.amount, payment.cadence),
    0
  )
  // Paused rows sink below the live checklist, dimmed, whatever their date
  const rows = [...active, ...payments.filter((payment) => payment.paused)].map(
    (payment) => ({
      ...payment,
      monthly: monthlyPence(payment.amount, payment.cadence),
    })
  )

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
            <DueNextCard payments={active} today={today} />
            <SubscriptionCostsCard payments={active} />
          </div>

          {/* Creep steps aside when nothing has risen and the calendar takes
              the row back: no news is the good state, not a grey card. */}
          {risers.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <MonthsAheadCard
                className="lg:col-span-2"
                payments={active}
                today={today}
              />
              <PriceCreepCard risers={risers} />
            </div>
          ) : (
            <MonthsAheadCard payments={active} today={today} />
          )}

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
