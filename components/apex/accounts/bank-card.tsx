"use client"

import { Ellipsis, Trash2 } from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { BankCard as BankCardRow } from "@/lib/apex/accounts/queries"

const spring = { type: "spring", stiffness: 500, damping: 32 } as const

type ExpiryState = "ok" | "soon" | "expired"

/** Cards are valid through the end of their expiry month. */
function expiryState(expiresOn: string | null): ExpiryState {
  if (!expiresOn) return "ok"
  const expiry = new Date(expiresOn)
  const endOfMonth = new Date(expiry.getFullYear(), expiry.getMonth() + 1, 0)
  const now = new Date()
  if (endOfMonth < now) return "expired"
  const soon = new Date(now)
  soon.setDate(soon.getDate() + 60)
  return endOfMonth <= soon ? "soon" : "ok"
}

function formatExpiry(expiresOn: string): string {
  const date = new Date(expiresOn)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = String(date.getFullYear()).slice(-2)
  return `${month}/${year}`
}

export function BankCard({
  card,
  accountName,
  onDelete,
}: {
  card: BankCardRow
  accountName: string
  onDelete: (card: BankCardRow) => void
}) {
  const expiry = expiryState(card.expires_on)

  return (
    <motion.div
      whileHover={{ y: -3, rotate: -0.4 }}
      transition={spring}
      data-bank-card={card.name}
      className="group relative flex aspect-[1.586/1] w-full flex-col overflow-hidden rounded-xl p-4 text-white shadow-md"
      style={{
        background: `linear-gradient(135deg, ${card.color}, color-mix(in srgb, ${card.color} 55%, #000))`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-[11px] text-white/70">
          {accountName}
        </span>
        {card.brand && (
          <span className="text-[11px] font-semibold tracking-[0.15em] uppercase">
            {card.brand}
          </span>
        )}
      </div>

      <span
        aria-hidden
        className="mt-3 block h-6 w-8 rounded-[5px] bg-white/25 ring-1 ring-white/20"
      />

      <div className="mt-auto space-y-1">
        <p className="truncate text-[12px] text-white/90">{card.name}</p>
        <div className="flex items-end justify-between gap-2">
          <span className="font-mono text-[13px] tracking-[0.22em]">
            {`•••• ${card.last4 ?? "····"}`}
          </span>
          {card.expires_on && (
            <span className="text-[10px] text-white/70">
              {formatExpiry(card.expires_on)}
            </span>
          )}
        </div>
      </div>

      {expiry !== "ok" && (
        <span
          className={
            expiry === "expired"
              ? "absolute right-3 bottom-11 rounded bg-red-500/90 px-1.5 py-0.5 text-[10px] font-medium"
              : "absolute right-3 bottom-11 rounded bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-medium text-amber-950"
          }
        >
          {expiry === "expired" ? "Expired" : "Expires soon"}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Options for ${card.name}`}
              className="absolute top-2.5 right-2.5 text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:text-white focus-visible:opacity-100 data-popup-open:opacity-100"
            />
          }
        >
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => onDelete(card)}
            className="text-destructive data-highlighted:text-destructive"
          >
            <Trash2 /> Remove card
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}
