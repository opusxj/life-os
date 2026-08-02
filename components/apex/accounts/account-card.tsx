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
      className="group"
    >
      <Card size="sm" className="h-full gap-2.5">
        <CardHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: account.color }}
            >
              <kind.icon className="size-4" />
            </span>
            <div className="min-w-0">
              <CardTitle className="truncate text-[13px]">
                {account.name}
              </CardTitle>
              <CardDescription className="truncate text-[11px]">
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
            {formatPence(account.balance)}
          </ApexStatValue>
        </CardContent>

        <CardFooter className="gap-1 px-2 py-1.5">
          <SyncBalancePopover account={account} />
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => onTransfer(account)}
          >
            <ArrowLeftRight /> Transfer
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
