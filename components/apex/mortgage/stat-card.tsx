import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * The card contract, encoded (docs/modules/apex.md): one question as an 11px
 * label, the answer as the biggest element, at most one muted 13px support
 * line, at most one in-place quick action.
 */
export function StatCard({
  label,
  action,
  className,
  children,
}: {
  label: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card size="sm" className={cn("gap-2.5", className)}>
      <CardHeader className="items-center">
        <CardTitle className="text-[11px] font-medium tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
        {action && <CardAction className="self-center">{action}</CardAction>}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end gap-1.5">
        {children}
      </CardContent>
    </Card>
  )
}

export function StatValue({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "text-2xl font-semibold tracking-tight tabular-nums",
        className
      )}
    >
      {children}
    </div>
  )
}

export function StatSupport({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn("truncate text-[13px] text-muted-foreground", className)}
    >
      {children}
    </div>
  )
}
