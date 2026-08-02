import { Wallet } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

/** Scrollable page body: centered column, house density. */
export function ApexPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-5xl space-y-7 p-4 pb-10", className)}
      {...props}
    />
  )
}

export function ApexPageHeader({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
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
      className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}
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
        <EmptyDescription>{`Being built right now — ${ticket}.`}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
