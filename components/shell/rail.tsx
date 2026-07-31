"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings, UserPlus, type LucideIcon } from "lucide-react"

import { homeModule, modules } from "@/lib/modules"
import { cn } from "@/lib/utils"

const railModules = [homeModule, ...modules]

export function Rail() {
  const pathname = usePathname()

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-px overflow-y-auto rounded-xl border border-white/10 bg-neutral-950 px-1 py-1.5">
      {railModules.map((mod) => {
        const href = mod.slug ? `/${mod.slug}` : "/"
        const active = mod.slug
          ? pathname.startsWith(`/${mod.slug}`)
          : pathname === "/"

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="group flex w-full flex-col items-center gap-0.5 rounded-lg py-1 outline-none"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-white text-neutral-950"
                  : "text-neutral-400 group-hover:bg-white/10 group-hover:text-white group-focus-visible:bg-white/10 group-focus-visible:text-white"
              )}
            >
              <mod.icon className="size-4" />
            </span>
            <span
              className={cn(
                "text-[9px] leading-none font-medium",
                active
                  ? "text-white"
                  : "text-neutral-400 group-hover:text-white"
              )}
            >
              {mod.name}
            </span>
          </Link>
        )
      })}

      <div className="mt-auto flex w-full flex-col items-center gap-px pt-2">
        <RailAction icon={UserPlus} label="Invite" />
        <RailAction icon={Settings} label="Settings" />
      </div>
    </nav>
  )
}

function RailAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      className="group flex w-full flex-col items-center gap-0.5 rounded-lg py-1 outline-none"
    >
      <span className="flex size-8 items-center justify-center rounded-lg text-neutral-400 transition-colors group-hover:bg-white/10 group-hover:text-white group-focus-visible:bg-white/10 group-focus-visible:text-white">
        <Icon className="size-4" />
      </span>
      <span className="text-[9px] leading-none font-medium text-neutral-400 group-hover:text-white">
        {label}
      </span>
    </button>
  )
}
