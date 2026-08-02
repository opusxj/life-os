import Link from "next/link"

import { MarkPaidButton } from "@/components/apex/subscriptions/mark-paid-button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { formatPence } from "@/lib/apex/money"
import type { ApexSidebarData } from "@/lib/apex/sidebar/queries"
import { cn } from "@/lib/utils"

/** Live sections under the Apex nav: always-visible balances + the next bill. */
export function ApexSidebarPanel({ data }: { data: ApexSidebarData }) {
  return (
    <>
      {data.accounts.length > 0 && (
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="h-auto px-1.5 pb-1 text-[11px] font-medium text-muted-foreground">
            Accounts
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-px">
              {data.accounts.map((account) => (
                <SidebarMenuItem key={account.id}>
                  <SidebarMenuButton
                    className="h-7.5 gap-2 px-1.5 text-[13px] text-sidebar-foreground/90"
                    render={
                      <Link
                        href={`/apex/transactions?account=${account.id}`}
                        title={`${account.name} transactions`}
                      />
                    }
                  >
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: account.color }}
                    />
                    <span className="truncate">{account.name}</span>
                    <span
                      className={cn(
                        "ml-auto text-[11px] text-muted-foreground tabular-nums",
                        account.balance < 0 && "text-destructive"
                      )}
                    >
                      {formatPence(account.balance)}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {data.nextDue && (
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="h-auto px-1.5 pb-1 text-[11px] font-medium text-muted-foreground">
            Up next
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-1.5 rounded-md px-1.5 py-1">
              <div className="flex items-baseline justify-between gap-2 text-[13px]">
                <span className="truncate">{data.nextDue.name}</span>
                <span className="shrink-0 tabular-nums">
                  {formatPence(data.nextDue.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-[11px]",
                    dueTone(data.nextDue.nextDueOn) === "overdue"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {dueLabel(data.nextDue.nextDueOn)}
                </span>
                <MarkPaidButton
                  paymentId={data.nextDue.id}
                  accountId={data.nextDue.accountId}
                  accounts={data.txnOptions.accounts}
                />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  )
}

/** Pinned below the scroll area: the headline number, always in view. */
export function ApexSidebarFooter({
  totalBalance,
  monthNet,
}: {
  totalBalance: number
  monthNet: number
}) {
  return (
    <div className="shrink-0 border-t px-3.5 py-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">
        Net position
      </p>
      <p
        className={cn(
          "text-[15px] font-semibold tracking-tight tabular-nums",
          totalBalance < 0 && "text-destructive"
        )}
      >
        {formatPence(totalBalance)}
      </p>
      <p
        className={cn(
          "text-[11px] tabular-nums",
          monthNet > 0
            ? "text-emerald-600 dark:text-emerald-400"
            : monthNet < 0
              ? "text-destructive"
              : "text-muted-foreground"
        )}
      >
        {`${monthNet > 0 ? "+" : ""}${formatPence(monthNet)} this month`}
      </p>
    </div>
  )
}

function dueTone(dateKey: string): "overdue" | "upcoming" {
  return dateKey < todayKey() ? "overdue" : "upcoming"
}

function dueLabel(dateKey: string): string {
  const today = todayKey()
  if (dateKey < today) return "Overdue"
  if (dateKey === today) return "Due today"
  const date = new Date(dateKey)
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

function todayKey(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
