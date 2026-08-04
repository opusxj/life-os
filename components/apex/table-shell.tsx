import * as React from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * The house table surface: one card, table edge to edge, nothing framing it.
 * Controls belong in the page header, not in a bar strapped to the table —
 * the card holds rows and only rows.
 */
export function TableCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <Card size="sm" className={cn("gap-0 p-0", className)} {...props} />
}

/**
 * The scrolling region inside a `TableCard`. In a `fill` page this is the only
 * thing that scrolls, which is what lets the column labels and totals stay
 * pinned.
 */
export function TableScroll({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-scroll"
      className={cn("min-h-0 flex-1 overflow-auto", className)}
      {...props}
    />
  )
}

/** In-card title row, for tables that aren't the whole page. */
export function TableCardHeader({
  title,
  count,
  children,
}: {
  title: string
  count?: string
  /** Right-aligned summary or actions */
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2.5">
      <span className="flex items-baseline gap-1.5 text-[13px] font-medium">
        {title}
        {count && (
          <span className="font-normal text-muted-foreground/70">{count}</span>
        )}
      </span>
      {children}
    </div>
  )
}

/**
 * Column labels: quiet. The divider is an inset shadow rather than a border
 * because collapsed table borders don't travel with a sticky cell.
 */
export const TABLE_HEAD =
  "h-9 bg-card text-[12px] font-normal text-muted-foreground shadow-[inset_0_-1px_0_0_var(--color-border)]"

/** Pinned variants — only for a table that owns its own scroll region. */
export const TABLE_PINNED_HEAD = `${TABLE_HEAD} sticky top-0 z-10`
export const TABLE_FOOT =
  "sticky bottom-0 z-10 bg-card shadow-[inset_0_1px_0_0_var(--color-border)]"

/**
 * A tinted pill carrying a data colour — categories, tags, anything with its
 * own swatch. Text is mixed toward the foreground so it clears contrast on its
 * own tint in both themes.
 */
export function DataChip({
  color,
  icon: Icon,
  children,
  className,
}: {
  color?: string | null
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full bg-(--chip-bg) px-2 py-0.5 text-[12px] font-medium text-(--chip-fg)",
        className
      )}
      style={
        {
          "--chip-bg": color
            ? `color-mix(in srgb, ${color} 14%, transparent)`
            : "var(--color-muted)",
          "--chip-fg": color
            ? `color-mix(in srgb, ${color} 60%, var(--color-foreground))`
            : "var(--color-muted-foreground)",
        } as React.CSSProperties
      }
    >
      {Icon ? (
        <Icon className="size-3 shrink-0" />
      ) : (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-(--chip-dot)"
          style={
            { "--chip-dot": color ?? "currentColor" } as React.CSSProperties
          }
        />
      )}
      <span className="truncate">{children}</span>
    </span>
  )
}
