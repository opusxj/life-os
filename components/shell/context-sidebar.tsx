"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Check, Plus, UserPlus, type LucideIcon } from "lucide-react"

import { CreateSpaceDialog } from "@/components/spaces/create-space-dialog"
import { ManageSpaceDialog } from "@/components/spaces/manage-space-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import type { Workspace } from "@/lib/data/workspace"
import { moduleForPath, type ModuleNavSection } from "@/lib/modules"
import { setActiveSpace } from "@/lib/spaces/actions"
import { cn } from "@/lib/utils"

/** House density on top of the stock shadcn menu button. */
const ROW_CLASS =
  "h-7.5 gap-2 px-1.5 text-[13px] text-sidebar-foreground/90 [&>svg]:text-muted-foreground data-active:[&>svg]:text-sidebar-accent-foreground"

/** Per-module live sidebar content, server-rendered by the shell layout.
 *  The module's slot only mounts while that module is active. */
export type ModuleSidebarSlot = {
  headerAction?: React.ReactNode
  panel?: React.ReactNode
  footer?: React.ReactNode
  /** Keyed by nav item href */
  navBadges?: Record<string, { count: number; tone: "destructive" | "amber" }>
}

export function ContextSidebar({
  workspace,
  apex,
}: {
  workspace: Workspace
  apex?: ModuleSidebarSlot
}) {
  const pathname = usePathname()
  const mod = moduleForPath(pathname)
  const isHome = mod.slug === ""
  const slot = mod.slug === "apex" ? apex : undefined

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
      {/* Provider only supplies context for the menu primitives — the shell's
          floating geometry stays ours, so its wrapper renders as `contents`. */}
      <SidebarProvider className="contents">
        <div className="flex h-11 shrink-0 items-center justify-between pr-2 pl-3.5">
          <h2 className="text-sm font-semibold text-sidebar-foreground">
            {mod.name}
          </h2>
          {slot?.headerAction ?? (
            <Button size="xs">
              <Plus /> Create
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-1.5 pt-0.5 pb-3">
          {mod.nav.map((section, sectionIndex) => (
            <NavSection
              key={section.label ?? sectionIndex}
              section={section}
              isPrimary={sectionIndex === 0}
              navBadges={slot?.navBadges}
            />
          ))}

          {slot?.panel}

          {isHome && (
            <>
              <SpacesSection workspace={workspace} />
              <MembersSection workspace={workspace} />
            </>
          )}
        </div>

        {slot?.footer}
      </SidebarProvider>
    </aside>
  )
}

function NavSection({
  section,
  isPrimary,
  navBadges,
}: {
  section: ModuleNavSection
  isPrimary: boolean
  navBadges?: ModuleSidebarSlot["navBadges"]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="p-0">
      {section.label && <SectionLabel>{section.label}</SectionLabel>}
      <SidebarGroupContent>
        <SidebarMenu className="gap-px">
          {section.items.map((item, itemIndex) => {
            const active = item.href
              ? isNavItemActive(item.href, pathname)
              : isPrimary && itemIndex === 0
            const badge = item.href ? navBadges?.[item.href] : undefined
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  isActive={active}
                  className={ROW_CLASS}
                  render={
                    item.href ? (
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                      />
                    ) : undefined
                  }
                >
                  <item.icon />
                  <span className="truncate">{item.label}</span>
                  {badge && (
                    <Badge
                      variant={
                        badge.tone === "destructive"
                          ? "destructive"
                          : "secondary"
                      }
                      className={cn(
                        "ml-auto h-4 min-w-4 px-1 text-[10px] tabular-nums",
                        badge.tone === "amber" &&
                          "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                      )}
                    >
                      {badge.count}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
          {section.placeholder && <GhostItem label={section.placeholder} />}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

/** Module roots ("/apex") match exactly; deeper routes own their subtree. */
function isNavItemActive(href: string, pathname: string) {
  if (pathname === href) return true
  return href.split("/").length > 2 && pathname.startsWith(`${href}/`)
}

function SpacesSection({ workspace }: { workspace: Workspace }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [createOpen, setCreateOpen] = React.useState(false)

  function selectSpace(id: string) {
    if (id === workspace.activeSpace.id) return
    startTransition(async () => {
      await setActiveSpace(id)
      router.refresh()
    })
  }

  return (
    <SidebarGroup className="p-0">
      <SectionLabel>Spaces</SectionLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-px">
          {workspace.spaces.map((space) => {
            const active = space.id === workspace.activeSpace.id
            return (
              <SidebarMenuItem key={space.id}>
                <SidebarMenuButton
                  isActive={active}
                  disabled={isPending}
                  onClick={() => selectSpace(space.id)}
                  data-space-item={space.name}
                  aria-current={active ? "true" : undefined}
                  className={ROW_CLASS}
                >
                  <span
                    className="flex size-4.5 shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white"
                    style={{ backgroundColor: space.color }}
                  >
                    {space.initial}
                  </span>
                  <span className="truncate">{space.name}</span>
                  {active && (
                    <Check className="ml-auto size-3.5 text-muted-foreground" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
          <GhostItem label="New space" onClick={() => setCreateOpen(true)} />
        </SidebarMenu>
      </SidebarGroupContent>
      <CreateSpaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </SidebarGroup>
  )
}

function MembersSection({ workspace }: { workspace: Workspace }) {
  const [manageOpen, setManageOpen] = React.useState(false)

  return (
    <SidebarGroup className="p-0">
      <SectionLabel>Members</SectionLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-px">
          {workspace.members.map((member) => (
            <SidebarMenuItem key={member.membershipId}>
              {/* Data row, not an action — deliberately not a menu button */}
              <div
                data-member-item={member.name}
                className="flex h-7.5 w-full items-center gap-2 rounded-md px-1.5 text-[13px] text-sidebar-foreground/90"
              >
                <span className="flex size-4.5 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background">
                  {member.initials}
                </span>
                <span className="truncate">{member.name}</span>
                {member.isCurrentUser && (
                  <span className="text-[11px] text-muted-foreground">
                    (you)
                  </span>
                )}
                {member.role !== "member" && (
                  <span className="ml-auto text-[11px] text-muted-foreground capitalize">
                    {member.role}
                  </span>
                )}
              </div>
            </SidebarMenuItem>
          ))}
          <GhostItem
            label="Invite people"
            icon={UserPlus}
            onClick={() => setManageOpen(true)}
          />
        </SidebarMenu>
      </SidebarGroupContent>
      <ManageSpaceDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        workspace={workspace}
      />
    </SidebarGroup>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <SidebarGroupLabel className="h-auto px-1.5 pb-1 text-[11px] font-medium text-muted-foreground">
      {children}
    </SidebarGroupLabel>
  )
}

function GhostItem({
  label,
  icon: Icon = Plus,
  onClick,
}: {
  label: string
  icon?: LucideIcon
  onClick?: () => void
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onClick}
        className={cn(ROW_CLASS, "text-muted-foreground")}
      >
        <Icon />
        <span className="truncate">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
