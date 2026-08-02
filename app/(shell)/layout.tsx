import { redirect } from "next/navigation"

import { ContextSidebar } from "@/components/shell/context-sidebar"
import { ShellFooter } from "@/components/shell/footer"
import { Rail } from "@/components/shell/rail"
import { TopBar } from "@/components/shell/top-bar"
import { getWorkspace } from "@/lib/data/workspace"

export default async function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const workspace = await getWorkspace()
  if (!workspace) redirect("/sign-in")

  return (
    <div className="flex h-svh flex-col gap-2 bg-muted p-2 dark:bg-neutral-950">
      <TopBar
        user={workspace.user}
        spaces={workspace.spaces}
        activeSpaceId={workspace.activeSpace.id}
      />
      <div className="flex min-h-0 flex-1 gap-2">
        <Rail />
        {/* Sidebar and body share one floating panel, joined by a border */}
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-xl border bg-background dark:bg-card">
          <ContextSidebar />
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
