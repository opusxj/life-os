"use client"

import { usePathname } from "next/navigation"
import { Plus, UserPlus, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { moduleForPath, type ModuleNavSection } from "@/lib/modules"
import { members, spaces } from "@/lib/workspace"
import { cn } from "@/lib/utils"

export function ContextSidebar() {
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
            <SpacesSection />
            <MembersSection />
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

function SpacesSection() {
  return (
    <div className="space-y-px">
      <SectionLabel>Spaces</SectionLabel>
      {spaces.map((space) => (
        <button
          key={space.id}
          type="button"
          className="flex h-7.5 w-full items-center gap-2 rounded-md px-1.5 text-[13px] text-sidebar-foreground/90 outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:bg-sidebar-accent"
        >
          <span
            className={cn(
              "flex size-4.5 items-center justify-center rounded text-[9px] font-semibold text-white",
              space.color
            )}
          >
            {space.initial}
          </span>
          <span className="truncate">{space.name}</span>
        </button>
      ))}
      <GhostItem label="New space" />
    </div>
  )
}

function MembersSection() {
  return (
    <div className="space-y-px">
      <SectionLabel>Members</SectionLabel>
      {members.map((member) => (
        <button
          key={member.id}
          type="button"
          className="flex h-7.5 w-full items-center gap-2 rounded-md px-1.5 text-[13px] text-sidebar-foreground/90 outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:bg-sidebar-accent"
        >
          <span className="relative flex size-4.5 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background">
            {member.initials}
            {member.online && (
              <span className="absolute -right-px -bottom-px size-1.5 rounded-full border border-sidebar bg-emerald-500" />
            )}
          </span>
          <span className="truncate">{member.name}</span>
          {member.isCurrentUser && (
            <span className="text-[11px] text-muted-foreground">— You</span>
          )}
        </button>
      ))}
      <GhostItem label="Invite people" icon={UserPlus} />
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
}: {
  label: string
  icon?: LucideIcon
}) {
  return (
    <button
      type="button"
      className="flex h-7.5 w-full items-center gap-2 rounded-md px-1.5 text-[13px] text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:bg-sidebar-accent"
    >
      <Icon className="size-4" />
      <span className="truncate">{label}</span>
    </button>
  )
}
