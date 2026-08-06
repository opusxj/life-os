import { Wallet } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

/**
 * Page body: full dashboard width, house density. `fill` is for pages that are
 * one table and nothing else — the page takes the body's exact height and the
 * table scrolls inside itself, so the shell never scrolls and the header,
 * column labels and totals all stay put.
 */
export function ApexPage({
  fill,
  className,
  ...props
}: React.ComponentProps<"div"> & { fill?: boolean }) {
  return (
    <div
      className={cn(
        // Capped like the reference dashboards: nothing on an Apex page is
        // ever full-bleed, because tick meters and charts scale badly wide
        "mx-auto w-full max-w-[1100px] p-5",
        fill ? "flex h-full min-h-0 flex-col gap-4" : "space-y-6 pb-10",
        className
      )}
      {...props}
    />
  )
}

export function ApexPageHeader({
  title,
  count,
  description,
  children,
}: {
  title: string
  /** Rendered muted beside the title — how many of the thing there are */
  count?: number
  /** Second line: the page's headline numbers, not filler prose */
  description?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h1 className="flex items-baseline gap-1.5 text-lg font-semibold tracking-tight">
          {title}
          {count !== undefined && (
            <span className="font-normal text-muted-foreground/70 tabular-nums">
              {`(${count})`}
            </span>
          )}
        </h1>
        {children && (
          <div className="flex flex-wrap items-center gap-2">{children}</div>
        )}
      </div>
      {description && <div className="text-[13px]">{description}</div>}
    </div>
  )
}

export function ApexSection({
  label,
  action,
  className,
  children,
}: {
  label?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("space-y-2.5", className)}>
      {(label || action) && (
        <div className="flex h-6 items-center justify-between gap-2">
          {label && (
            <h2 className="text-[13px] font-medium text-muted-foreground">
              {label}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function ApexCardGrid({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
        className
      )}
      {...props}
    />
  )
}

/** Stub body for pages whose ticket hasn't landed yet. */
export function ApexPlaceholder({
  title,
  ticket,
}: {
  title: string
  ticket: string
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Wallet />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{`Being built right now. ${ticket}.`}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
