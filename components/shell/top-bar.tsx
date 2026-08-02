"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronDown,
  CircleUser,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Settings2,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import { NotificationsMenu } from "@/components/shell/notifications-menu"
import { CreateSpaceDialog } from "@/components/spaces/create-space-dialog"
import { ManageSpaceDialog } from "@/components/spaces/manage-space-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { signOut } from "@/lib/auth/actions"
import type { CurrentUser, Workspace } from "@/lib/data/workspace"
import { setActiveSpace } from "@/lib/spaces/actions"
import { cn } from "@/lib/utils"

export function TopBar({ workspace }: { workspace: Workspace }) {
  return (
    <header className="relative flex h-11 shrink-0 items-center justify-between gap-2 rounded-xl border bg-background px-1.5 dark:bg-card">
      <SpaceSwitcher workspace={workspace} />
      <SearchButton />
      <div className="flex items-center gap-0.5">
        <NotificationsMenu invites={workspace.myInvites} />
        <ThemeToggle />
        <UserMenu user={workspace.user} />
      </div>
    </header>
  )
}

function SpaceSwitcher({ workspace }: { workspace: Workspace }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [manageOpen, setManageOpen] = React.useState(false)

  const { spaces, activeSpace } = workspace

  function selectSpace(id: string) {
    if (id === activeSpace.id) return
    startTransition(async () => {
      await setActiveSpace(id)
      router.refresh()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-1.5 px-1 text-[13px]", isPending && "opacity-60")}
            />
          }
        >
          <Avatar size="sm" className="size-5.5 rounded-md after:rounded-md">
            <AvatarFallback
              className="rounded-md text-[10px] font-semibold text-white"
              style={{ backgroundColor: activeSpace.color }}
            >
              {activeSpace.initial}
            </AvatarFallback>
          </Avatar>
          {activeSpace.name}
          <ChevronDown className="size-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Spaces</DropdownMenuLabel>
            {spaces.map((space) => (
              <DropdownMenuItem key={space.id} onClick={() => selectSpace(space.id)}>
                <Avatar size="sm" className="size-5 rounded-md after:rounded-md">
                  <AvatarFallback
                    className="rounded-md text-[10px] font-semibold text-white"
                    style={{ backgroundColor: space.color }}
                  >
                    {space.initial}
                  </AvatarFallback>
                </Avatar>
                {space.name}
                {space.id === activeSpace.id && <Check className="ml-auto size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setManageOpen(true)}>
            <Settings2 /> Manage space
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus /> New space
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateSpaceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ManageSpaceDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        workspace={workspace}
      />
    </>
  )
}

function SearchButton() {
  return (
    <Button
      variant="outline"
      className="absolute top-1/2 left-1/2 hidden h-7.5 w-72 max-w-[38vw] -translate-x-1/2 -translate-y-1/2 justify-start gap-2 rounded-full bg-muted/40 px-3 text-[13px] font-normal text-muted-foreground hover:bg-muted hover:text-muted-foreground md:flex"
    >
      <Search className="size-3.5" />
      <span className="flex-1 text-left">Search</span>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </Button>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  )
}

function UserMenu({ user }: { user: CurrentUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label="Account"
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback className="bg-foreground text-[10px] font-semibold text-background">
            {user.initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              {user.name}
              <span className="text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <CircleUser /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
