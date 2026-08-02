"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, MotionConfig } from "motion/react"
import { Settings, UserPlus, type LucideIcon } from "lucide-react"

import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { homeModule, modules, type LifeModule } from "@/lib/modules"
import { cn } from "@/lib/utils"

const railModules = [homeModule, ...modules]

const spring = { type: "spring", stiffness: 500, damping: 32 } as const

export function Rail() {
  const pathname = usePathname()
  const router = useRouter()
  const navRef = React.useRef<HTMLElement>(null)

  // Alt+1..6 jumps straight to a module
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }
      const match = /^Digit([1-9])$/.exec(event.code)
      if (!match) return
      const mod = railModules[Number(match[1]) - 1]
      if (!mod) return
      event.preventDefault()
      router.push(mod.slug ? `/${mod.slug}` : "/")
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [router])

  // Arrow keys move focus through rail items, wrapping at the ends
  function handleNavKeyDown(event: React.KeyboardEvent) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return
    const items = Array.from(
      navRef.current?.querySelectorAll<HTMLElement>("[data-rail-item]") ?? []
    )
    const current = items.indexOf(document.activeElement as HTMLElement)
    if (current === -1 || items.length === 0) return
    event.preventDefault()
    const next =
      event.key === "ArrowDown"
        ? (current + 1) % items.length
        : event.key === "ArrowUp"
          ? (current - 1 + items.length) % items.length
          : event.key === "Home"
            ? 0
            : items.length - 1
    items[next]?.focus()
  }

  return (
    <MotionConfig reducedMotion="user">
      <nav
        ref={navRef}
        onKeyDown={handleNavKeyDown}
        className="flex w-14 shrink-0 flex-col items-center gap-px overflow-y-auto rounded-xl border border-white/10 bg-neutral-950 px-1 py-1.5"
      >
        {railModules.map((mod, index) => {
          const active = mod.slug
            ? pathname.startsWith(`/${mod.slug}`)
            : pathname === "/"
          return (
            <RailModule
              key={mod.slug || "home"}
              mod={mod}
              index={index}
              active={active}
            />
          )
        })}

        <div className="mt-auto flex w-full flex-col items-center gap-px pt-2">
          <RailAction icon={UserPlus} label="Invite" />
          <RailAction icon={Settings} label="Settings" />
        </div>
      </nav>
    </MotionConfig>
  )
}

function RailModule({
  mod,
  index,
  active,
}: {
  mod: LifeModule
  index: number
  active: boolean
}) {
  const href = mod.slug ? `/${mod.slug}` : "/"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            data-rail-item
            aria-current={active ? "page" : undefined}
            className="group flex w-full flex-col items-center gap-0.5 rounded-lg py-1 outline-none"
          />
        }
      >
        <motion.span
          whileHover={{ scale: 1.08, y: -1 }}
          whileTap={{ scale: 0.92 }}
          transition={spring}
          className={cn(
            "relative flex size-8 items-center justify-center rounded-lg",
            !active &&
              "group-hover:bg-white/10 group-focus-visible:bg-white/10"
          )}
        >
          {active && (
            <motion.span
              layoutId="rail-active-tile"
              transition={spring}
              className={cn("absolute inset-0 rounded-lg", mod.accent.tile)}
            />
          )}
          <mod.icon
            className={cn(
              "relative z-10 size-4 transition-colors",
              active
                ? mod.accent.activeIcon
                : "text-neutral-400 group-hover:text-white group-focus-visible:text-white"
            )}
          />
        </motion.span>
        <span
          className={cn(
            "text-[9px] leading-none font-medium transition-colors",
            active
              ? mod.accent.label
              : "text-neutral-400 group-hover:text-white group-focus-visible:text-white"
          )}
        >
          {mod.name}
        </span>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {mod.name} · {mod.domain}
        <KbdGroup className="gap-0.5">
          <Kbd className="h-4 min-w-4 px-1 text-[10px]">Alt</Kbd>
          <Kbd className="h-4 min-w-4 px-1 text-[10px]">{index + 1}</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  )
}

function RailAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      data-rail-item
      className="group flex w-full flex-col items-center gap-0.5 rounded-lg py-1 outline-none"
    >
      <motion.span
        whileHover={{ scale: 1.08, y: -1 }}
        whileTap={{ scale: 0.92 }}
        transition={spring}
        className="flex size-8 items-center justify-center rounded-lg transition-colors group-hover:bg-white/10 group-focus-visible:bg-white/10"
      >
        <Icon className="size-4 text-neutral-400 transition-colors group-hover:text-white group-focus-visible:text-white" />
      </motion.span>
      <span className="text-[9px] leading-none font-medium text-neutral-400 transition-colors group-hover:text-white group-focus-visible:text-white">
        {label}
      </span>
    </button>
  )
}
