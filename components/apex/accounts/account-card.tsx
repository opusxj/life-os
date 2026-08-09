"use client"

import { ArrowLeftRight, Ellipsis, Pencil, Trash2 } from "lucide-react"
import { motion } from "motion/react"

import { accountKindMeta } from "@/components/apex/accounts/meta"
import { SyncBalancePopover } from "@/components/apex/accounts/sync-balance-popover"
import {
  ApexStatCard,
  ApexStatFigure,
  ApexStatValue,
} from "@/components/apex/stat-card"
import { MetaDot } from "@/components/shared/meta-dot"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatPenceShort } from "@/lib/apex/money"
import { HOUSE_SPRING } from "@/lib/motion"
import type { Account } from "@/lib/apex/accounts/queries"
import { cn } from "@/lib/utils"

/**
 * One account, in the ratified card grammar: the account is its own header
 * (name as title, institution and type as the quiet facts line, menu in the
 * corner), the balance free-standing below with its provenance stated. The
 * chip wears the account's own color via ApexStatCard's iconColor.
 */
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
      transition={HOUSE_SPRING}
      data-account-card={account.name}
      className="group h-full"
    >
      <ApexStatCard
        label={account.name}
        description={
          account.institution ? (
            <>
              {account.institution}
              <MetaDot />
              {kind.label}
            </>
          ) : (
            kind.label
          )
        }
        icon={kind.icon}
        iconColor={account.color}
        className="h-full"
        action={
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
        }
        footer={
          <>
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
          </>
        }
      >
        {/* Provenance, tied to the number it explains: the balance trigger
            sums the ledger, so this is where the figure truly comes from
            (syncs and starting balances post adjustment transactions). */}
        <div className="text-[12px] text-muted-foreground">
          Balance, from every transaction recorded
        </div>
        <div className="mt-0.5">
          <ApexStatValue className={cn(negative && "text-destructive")}>
            <ApexStatFigure negative={negative}>
              {formatPenceShort(account.balance)}
            </ApexStatFigure>
          </ApexStatValue>
        </div>
      </ApexStatCard>
    </motion.div>
  )
}
