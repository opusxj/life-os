import { redirect } from "next/navigation"

import {
  ApexSidebarFooter,
  ApexSidebarPanel,
} from "@/components/apex/sidebar/panel"
import { ApexQuickAdd } from "@/components/apex/sidebar/quick-add"
import { ContextSidebar } from "@/components/shell/context-sidebar"
import { ShellFooter } from "@/components/shell/footer"
import { Rail } from "@/components/shell/rail"
import { TopBar } from "@/components/shell/top-bar"
import { getApexSidebarData } from "@/lib/apex/sidebar/queries"
import { getWorkspace } from "@/lib/data/workspace"

export default async function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const workspace = await getWorkspace()
  if (!workspace) redirect("/sign-in")

  // Fetched for every shell page (the layout can't know the active module on
  // the server); the queries are light and the slot only mounts inside Apex.
  const apexData = await getApexSidebarData(workspace.activeSpace.id)
  const apexNavBadges: NonNullable<
    React.ComponentProps<typeof ContextSidebar>["apex"]
  >["navBadges"] = {}
  if (apexData.dueBadge) {
    apexNavBadges["/apex/subscriptions"] = apexData.dueBadge
  }
  if (apexData.overBudgetCount > 0) {
    apexNavBadges["/apex/budgets"] = {
      count: apexData.overBudgetCount,
      tone: "amber",
    }
  }

  const apexSlot = {
    headerAction: (
      <ApexQuickAdd
        spaceId={workspace.activeSpace.id}
        options={apexData.txnOptions}
      />
    ),
    panel: <ApexSidebarPanel data={apexData} />,
    footer: (
      <ApexSidebarFooter
        totalBalance={apexData.totalBalance}
        monthNet={apexData.monthNet}
      />
    ),
    navBadges: apexNavBadges,
  }

  return (
    <div className="flex h-svh flex-col gap-2 bg-muted p-2 dark:bg-neutral-950">
      <TopBar workspace={workspace} />
      <div className="flex min-h-0 flex-1 gap-2">
        <Rail />
        {/* Sidebar and body share one floating panel, joined by a border */}
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-xl border bg-background dark:bg-card">
          <ContextSidebar workspace={workspace} apex={apexSlot} />
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex min-w-0 flex-1 overflow-y-auto">
              {children}
            </main>
            <ShellFooter />
          </div>
        </div>
      </div>
    </div>
  )
}
