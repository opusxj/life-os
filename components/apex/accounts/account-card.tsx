"use client"

import { ArrowLeftRight, Ellipsis, Pencil, Trash2 } from "lucide-react"
import { motion } from "motion/react"

import { accountKindMeta } from "@/components/apex/accounts/meta"
import { SyncBalancePopover } from "@/components/apex/accounts/sync-balance-popover"
import { ApexStatValue } from "@/components/apex/stat-card"
import { MetaDot } from "@/components/shared/meta-dot"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
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

/**
 * One account, in the ratified card grammar: the account is its own header
 * (name as title, institution and type as the quiet facts line, menu in the
 * corner), the balance free-standing below with its provenance stated. The
 * chip can't use ApexStatCard's iconClassName because its tint is mixed from
 * the account's own color at runtime, so the header is hand-rolled to the
 * same 38px grammar.
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
      transition={spring}
      data-account-card={account.name}
      className="group h-full"
    >
      <Card className="h-full gap-3.5 rounded-2xl [--card-spacing:--spacing(5)]">
        <CardHeader>
          <div className="flex min-w-0 items-center gap-2.5">
            {/* Tinted chip, not a solid hex tile — white-on-hex failed 3:1 on
                the amber/emerald/sky swatches. Light mode darkens the icon
                toward black; dark mode runs the raw hex on a stronger tint. */}
            <span
              aria-hidden
              className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-(--chip-bg) text-(--chip-icon) dark:bg-(--chip-bg-dark) dark:text-(--chip-icon-dark)"
              style={
                {
                  "--chip-bg": `color-mix(in srgb, ${account.color} 14%, transparent)`,
                  "--chip-icon": `color-mix(in srgb, ${account.color} 75%, black)`,
                  "--chip-bg-dark": `color-mix(in srgb, ${account.color} 20%, transparent)`,
                  "--chip-icon-dark": account.color,
                } as React.CSSProperties
              }
            >
              <kind.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-card-foreground">
                {account.name}
              </span>
              <span className="block truncate text-[12px] leading-snug text-muted-foreground">
                {account.institution ? (
                  <>
                    {account.institution}
                    <MetaDot />
                    {kind.label}
                  </>
                ) : (
                  kind.label
                )}
              </span>
            </span>
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
          {/* Provenance, tied to the number it explains: the balance trigger
              sums the ledger, so this is where the figure truly comes from
              (syncs and starting balances post adjustment transactions). */}
          <div className="text-[12px] text-muted-foreground">
            Balance, from every transaction recorded
          </div>
          <div className="mt-0.5">
            <ApexStatValue className={cn(negative && "text-destructive")}>
              <BalanceFigure pence={account.balance} negative={negative} />
            </ApexStatValue>
          </div>
        </CardContent>

        <CardFooter className="gap-1 px-2.5 py-2">
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

/**
 * £450 renders whole (formatPenceShort drops the ".00"); £4,520.20 fades its
 * pence so the pounds carry the scan. Negative balances fade by opacity so
 * the pence stay in the warning color instead of going grey inside a red
 * figure.
 */
function BalanceFigure({
  pence,
  negative,
}: {
  pence: number
  negative: boolean
}) {
  const text = formatPenceShort(pence)
  const dot = text.lastIndexOf(".")
  if (dot === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, dot)}
      <span className={negative ? "opacity-60" : "text-muted-foreground/60"}>
        {text.slice(dot)}
      </span>
    </>
  )
}
