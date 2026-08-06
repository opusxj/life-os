import type { Metadata } from "next"
import { redirect } from "next/navigation"
import {
  Banknote,
  CalendarClock,
  CalendarSync,
  ReceiptText,
  Repeat,
} from "lucide-react"

import { ANCHOR_TINTS, type TagTint } from "@/components/apex/anchor-tints"
import { dueState, todayKey, type DueState } from "@/components/apex/due-state"
import { AddRecurringButton } from "@/components/apex/subscriptions/add-recurring-button"
import { RecurringTable } from "@/components/apex/subscriptions/recurring-table"
import { ApexCardGrid, ApexPage, ApexPageHeader } from "@/components/apex/page"
import {
  ApexStatCard,
  ApexStatHint,
  ApexStatTag,
  ApexStatUnit,
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
  const nextDue = payments.at(0)
  const nextDuePill = nextDue
    ? duePill(dueState(nextDue.nextDueOn, today))
    : null
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
              label="Outgoings"
              description="All recurring, scaled to a month"
              icon={Banknote}
              iconClassName={ANCHOR_TINTS.primary}
            >
              <ApexStatValue>
                {formatPenceShort(totalMonthly)}{" "}
                <ApexStatUnit>a month</ApexStatUnit>
              </ApexStatValue>
              <div className="mt-2.5">
                <ApexStatTag>
                  {payments.length === 1
                    ? "1 recurring payment"
                    : `${payments.length} recurring payments`}
                </ApexStatTag>
              </div>
            </ApexStatCard>
            <ApexStatCard
              label="Subscriptions"
              description="The optional part of the total"
              icon={Repeat}
              iconClassName={ANCHOR_TINTS.subscription}
            >
              <ApexStatValue>
                {formatPenceShort(subscriptionsMonthly)}{" "}
                <ApexStatUnit>a month</ApexStatUnit>
              </ApexStatValue>
              <div className="mt-2.5">
                <ApexStatTag>
                  {subscriptions.length === 1
                    ? "1 subscription"
                    : `${subscriptions.length} subscriptions`}
                </ApexStatTag>
              </div>
            </ApexStatCard>
            <ApexStatCard
              label="Bills"
              description="The committed part of the total"
              icon={ReceiptText}
              iconClassName={ANCHOR_TINTS.bill}
            >
              <ApexStatValue>
                {formatPenceShort(billsMonthly)}{" "}
                <ApexStatUnit>a month</ApexStatUnit>
              </ApexStatValue>
              <div className="mt-2.5">
                <ApexStatTag>
                  {bills.length === 1 ? "1 bill" : `${bills.length} bills`}
                </ApexStatTag>
              </div>
            </ApexStatCard>
            <ApexStatCard
              label="Next due"
              description="The first date on the schedule"
              icon={CalendarClock}
              iconClassName={ANCHOR_TINTS.due}
            >
              {nextDue && nextDuePill ? (
                <>
                  <ApexStatValue className="truncate">
                    {formatPenceShort(nextDue.amount)}{" "}
                    <ApexStatUnit>{`to ${nextDue.name}`}</ApexStatUnit>
                  </ApexStatValue>
                  <div className="mt-2.5">
                    <ApexStatTag tint={nextDuePill.tint}>
                      {nextDuePill.label}
                    </ApexStatTag>
                  </div>
                </>
              ) : (
                <>
                  <ApexStatValue>—</ApexStatValue>
                  <ApexStatHint>Nothing scheduled</ApexStatHint>
                </>
              )}
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

/**
 * The due date as a discrete-fact pill, event stated in the words ("Due
 * tomorrow", never a bare "Tomorrow"). Amber is the deadline tint; overdue
 * escalates to destructive, matching the table's due language below.
 */
function duePill(state: DueState): { label: string; tint: TagTint } {
  if (state.status === "overdue") {
    return { label: "Overdue", tint: "destructive" }
  }
  if (state.status === "today") return { label: "Due today", tint: "due" }
  if (state.days === 1) return { label: "Due tomorrow", tint: "due" }
  if (state.days <= 7) {
    return { label: `Due in ${state.days} days`, tint: "due" }
  }
  // Beyond a week dueState's label is already the short date, "Mon 3 Aug"
  return { label: `Due ${state.label}`, tint: "due" }
}
