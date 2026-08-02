"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Check, Plus, UserPlus, type LucideIcon } from "lucide-react"

import { CreateSpaceDialog } from "@/components/spaces/create-space-dialog"
import { ManageSpaceDialog } from "@/components/spaces/manage-space-dialog"
import { Button } from "@/components/ui/button"
import type { Workspace } from "@/lib/data/workspace"
import { moduleForPath, type ModuleNavSection } from "@/lib/modules"
import { setActiveSpace } from "@/lib/spaces/actions"
import { cn } from "@/lib/utils"

export function ContextSidebar({ workspace }: { workspace: Workspace }) {
  const pathname = usePathname()
  const mod = moduleForPath(pathname)
  const isHome = mod.slug === ""

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
      <div className="flex h-11 shrink-0 items-center justify-between pr-2 pl-3.5">
        <h2 className="text-sm font-semibold text-sidebar-foreground">
          {mod.name}
        </h2>
        <Button size="xs">
          <Plus /> Create
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-1.5 pt-0.5 pb-3">
        {mod.nav.map((section, sectionIndex) => (
          <NavSection
            key={section.label ?? sectionIndex}
            section={section}
            isPrimary={sectionIndex === 0}
          />
        ))}

        {isHome && (
          <>
            <SpacesSection workspace={workspace} />
            <MembersSection workspace={workspace} />
          </>
        )}
      </div>
    </aside>
  )
}

function NavSection({
  section,
  isPrimary,
}: {
  section: ModuleNavSection
  isPrimary: boolean
}) {
  return (
    <div className="space-y-px">
      {section.label && <SectionLabel>{section.label}</SectionLabel>}
      {section.items.map((item, itemIndex) => (
        <SidebarItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          active={isPrimary && itemIndex === 0}
        />
      ))}
      {section.placeholder && <GhostItem label={section.placeholder} />}
    </div>
  )
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
    <div className="space-y-px">
      <SectionLabel>Spaces</SectionLabel>
      {workspace.spaces.map((space) => {
        const active = space.id === workspace.activeSpace.id
        return (
          <button
            key={space.id}
            type="button"
            data-space-item={space.name}
            aria-current={active ? "true" : undefined}
            disabled={isPending}
            onClick={() => selectSpace(space.id)}
            className={cn(
              "flex h-7.5 w-full items-center gap-2 rounded-md px-1.5 text-[13px] outline-none focus-visible:bg-sidebar-accent",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <span
              className="flex size-4.5 items-center justify-center rounded text-[9px] font-semibold text-white"
              style={{ backgroundColor: space.color }}
            >
              {space.initial}
            </span>
            <span className="truncate">{space.name}</span>
            {active && <Check className="ml-auto size-3.5 text-muted-foreground" />}
          </button>
        )
      })}
      <GhostItem label="New space" onClick={() => setCreateOpen(true)} />
      <CreateSpaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}

function MembersSection({ workspace }: { workspace: Workspace }) {
  const [manageOpen, setManageOpen] = React.useState(false)

  return (
    <div className="space-y-px">
      <SectionLabel>Members</SectionLabel>
      {workspace.members.map((member) => (
        <div
          key={member.membershipId}
          data-member-item={member.name}
          className="flex h-7.5 w-full items-center gap-2 rounded-md px-1.5 text-[13px] text-sidebar-foreground/90"
        >
          <span className="flex size-4.5 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background">
            {member.initials}
          </span>
          <span className="truncate">{member.name}</span>
          {member.isCurrentUser && (
            <span className="text-[11px] text-muted-foreground">— you</span>
          )}
          {member.role !== "member" && (
            <span className="ml-auto text-[11px] text-muted-foreground capitalize">
              {member.role}
            </span>
          )}
        </div>
      ))}
      <GhostItem
        label="Invite people"
        icon={UserPlus}
        onClick={() => setManageOpen(true)}
      />
      <ManageSpaceDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        workspace={workspace}
      />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-1.5 pb-1 text-[11px] font-medium text-muted-foreground">
      {children}
    </div>
  )
}

function SidebarItem({
  icon: Icon,
  label,
  active,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-7.5 w-full items-center gap-2 rounded-md px-1.5 text-[13px] outline-none focus-visible:bg-sidebar-accent",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon
        className={cn(
          "size-4",
          active ? "text-sidebar-accent-foreground" : "text-muted-foreground"
        )}
      />
      <span className="truncate">{label}</span>
    </button>
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
    <button
      type="button"
      onClick={onClick}
      className="flex h-7.5 w-full items-center gap-2 rounded-md px-1.5 text-[13px] text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:bg-sidebar-accent"
    >
      <Icon className="size-4" />
      <span className="truncate">{label}</span>
    </button>
  )
}
