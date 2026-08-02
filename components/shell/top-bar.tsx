"use client"

import * as React from "react"
import {
  Bell,
  Check,
  ChevronDown,
  CircleUser,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { signOut } from "@/lib/auth/actions"
import type { CurrentUser } from "@/lib/data/workspace"
import { spaces } from "@/lib/workspace"
import { cn } from "@/lib/utils"

export function TopBar({ user }: { user: CurrentUser }) {
  return (
    <header className="relative flex h-11 shrink-0 items-center justify-between gap-2 rounded-xl border bg-background px-1.5 dark:bg-card">
      <SpaceSwitcher />
      <SearchButton />
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell />
        </Button>
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  )
}

function SpaceSwitcher() {
  const [spaceId, setSpaceId] = React.useState(spaces[0].id)
  const space = spaces.find((s) => s.id === spaceId) ?? spaces[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5 px-1 text-[13px]" />
        }
      >
        <span
          className={cn(
            "flex size-5.5 items-center justify-center rounded-md text-[10px] font-semibold text-white",
            space.color
          )}
        >
          {space.initial}
        </span>
        {space.name}
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Spaces</DropdownMenuLabel>
        {spaces.map((s) => (
          <DropdownMenuItem key={s.id} onClick={() => setSpaceId(s.id)}>
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded text-[10px] font-semibold text-white",
                s.color
              )}
            >
              {s.initial}
            </span>
            {s.name}
            {s.id === spaceId && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Plus /> New space
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SearchButton() {
  return (
    <button
      type="button"
      className="absolute top-1/2 left-1/2 hidden h-7.5 w-72 max-w-[38vw] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border bg-muted/40 px-3 text-[13px] text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:flex"
    >
      <Search className="size-3.5" />
      <span className="flex-1 text-left">Search</span>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </button>
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
        <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
          {user.initials}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            {user.name}
            <span className="text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
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
