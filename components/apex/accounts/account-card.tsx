"use client"

import { ArrowLeftRight, Ellipsis, Pencil, Trash2 } from "lucide-react"
import { motion } from "motion/react"

import { accountKindMeta } from "@/components/apex/accounts/meta"
import { SyncBalancePopover } from "@/components/apex/accounts/sync-balance-popover"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatPence } from "@/lib/apex/money"
import type { Account } from "@/lib/apex/accounts/queries"
import { cn } from "@/lib/utils"

const spring = { type: "spring", stiffness: 500, damping: 32 } as const

export function AccountCard({
  account,
  onEdit,
  onTransfer,
  onDelete,
}: {
  account: Account
  onEdit: (account: Account) => void
  onTransfer: (account: Account) => void
  onDelete: (account: Account) => void
}) {
  const kind = accountKindMeta(account.kind)
  const negative = account.balance < 0

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={spring}
      data-account-card={account.name}
      className="group relative flex flex-col rounded-lg border bg-card p-3.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: account.color }}
          >
            <kind.icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{account.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {account.institution
                ? `${account.institution} · ${kind.label}`
                : kind.label}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Options for ${account.name}`}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
              />
            }
          >
            <Ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(account)}>
              <Pencil /> Edit account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(account)}
              className="text-destructive data-highlighted:text-destructive"
            >
              <Trash2 /> Delete account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p
        className={cn(
          "mt-3 text-[22px] font-semibold tracking-tight tabular-nums",
          negative && "text-destructive"
        )}
      >
        {formatPence(account.balance)}
      </p>

      <div className="mt-2.5 flex items-center gap-1">
        <SyncBalancePopover account={account} />
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground"
          onClick={() => onTransfer(account)}
        >
          <ArrowLeftRight /> Transfer
        </Button>
      </div>
    </motion.div>
  )
}
