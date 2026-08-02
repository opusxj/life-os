import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  Banknote,
  CalendarClock,
  CalendarSync,
  ReceiptText,
  Repeat,
} from "lucide-react"

import { ANCHOR_TINTS } from "@/components/apex/anchor-tints"
import { dueState, todayKey } from "@/components/apex/due-state"
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
import { formatPenceShort } from "@/lib/apex/money"
import {
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

  const { payments, accounts, categories } = await getSubscriptionsPageData(
    workspace.activeSpace.id
  )

  const spaceId = workspace.activeSpace.id
  const today = todayKey()
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
  const totalMonthly = subscriptionsMonthly + billsMonthly
  // Query is ordered by next_due_on, so the soonest is first
  const nextDue = payments[0]
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
          <ApexCardGrid className="xl:grid-cols-4">
            <ApexStatCard
              label="Outgoings / month"
              icon={Banknote}
              iconClassName={ANCHOR_TINTS.primary}
            >
              <ApexStatValue>{formatPenceShort(totalMonthly)}</ApexStatValue>
              <ApexStatHint>
                {payments.length === 1
                  ? `1 recurring payment`
                  : `${payments.length} recurring payments`}
              </ApexStatHint>
            </ApexStatCard>
            <ApexStatCard
              label="Subscriptions / month"
              icon={Repeat}
              iconClassName={ANCHOR_TINTS.subscription}
            >
              <ApexStatValue>
                {formatPenceShort(subscriptionsMonthly)}
              </ApexStatValue>
              <ApexStatHint>
                {subscriptions.length === 1
                  ? `1 active subscription`
                  : `${subscriptions.length} active subscriptions`}
              </ApexStatHint>
            </ApexStatCard>
            <ApexStatCard
              label="Bills / month"
              icon={ReceiptText}
              iconClassName={ANCHOR_TINTS.bill}
            >
              <ApexStatValue>{formatPenceShort(billsMonthly)}</ApexStatValue>
              <ApexStatHint>
                {bills.length === 1
                  ? `1 committed bill`
                  : `${bills.length} committed bills`}
              </ApexStatHint>
            </ApexStatCard>
            <ApexStatCard
              label="Next due"
              icon={CalendarClock}
              iconClassName={ANCHOR_TINTS.due}
            >
              <ApexStatValue>
                {nextDue ? formatPenceShort(nextDue.amount) : "—"}
              </ApexStatValue>
              <ApexStatHint className="truncate">
                {nextDue
                  ? `${nextDue.name} · ${dueState(nextDue.nextDueOn, today).label}`
                  : `Nothing scheduled`}
              </ApexStatHint>
            </ApexStatCard>
          </ApexCardGrid>

          <RecurringTable
            payments={rows}
            monthlyTotal={totalMonthly}
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
