"use client"

import { ArrowLeftRight, Ellipsis, Pencil, Trash2 } from "lucide-react"
import { motion } from "motion/react"

import { accountKindMeta } from "@/components/apex/accounts/meta"
import { SyncBalancePopover } from "@/components/apex/accounts/sync-balance-popover"
import { ApexStatValue } from "@/components/apex/stat-card"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatPenceShort } from "@/lib/apex/money"
import type { Account } from "@/lib/apex/accounts/queries"
import { cn } from "@/lib/utils"

const spring = { type: "spring", stiffness: 500, damping: 32 } as const

export function AccountCard({
  account,
  canTransfer,
  onEdit,
  onTransfer,
  onDelete,
}: {
  account: Account
  /** Transfers need a second account — mirrors the page-header gate. */
  canTransfer: boolean
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
      className="group"
    >
      <Card size="sm" className="h-full gap-2.5">
        <CardHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            {/* Tinted chip, not a solid hex tile — white-on-hex failed 3:1 on
                the amber/emerald/sky swatches. Light mode darkens the icon
                toward black; dark mode runs the raw hex on a stronger tint. */}
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--chip-bg) text-(--chip-icon) dark:bg-(--chip-bg-dark) dark:text-(--chip-icon-dark)"
              style={
                {
                  "--chip-bg": `color-mix(in srgb, ${account.color} 14%, transparent)`,
                  "--chip-icon": `color-mix(in srgb, ${account.color} 75%, black)`,
                  "--chip-bg-dark": `color-mix(in srgb, ${account.color} 20%, transparent)`,
                  "--chip-icon-dark": account.color,
                } as React.CSSProperties
              }
            >
              <kind.icon className="size-4" />
            </span>
            <div className="min-w-0">
              <CardTitle className="truncate text-[13px]">
                {account.name}
              </CardTitle>
              <CardDescription className="truncate text-[13px]">
                {account.institution
                  ? `${account.institution} · ${kind.label}`
                  : kind.label}
              </CardDescription>
            </div>
          </div>
          <CardAction>
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
          </CardAction>
        </CardHeader>

        <CardContent className="flex-1">
          <ApexStatValue className={cn(negative && "text-destructive")}>
            {formatPenceShort(account.balance)}
          </ApexStatValue>
        </CardContent>

        <CardFooter className="gap-1 px-2 py-1.5">
          <SyncBalancePopover account={account} />
          {/* Hidden rather than disabled: the button's disabled state kills
              pointer events, so a title hint would never surface. */}
          {canTransfer && (
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground"
              onClick={() => onTransfer(account)}
            >
              <ArrowLeftRight /> Transfer
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
