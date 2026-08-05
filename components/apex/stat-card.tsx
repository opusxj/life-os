import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * The standard Apex card: one question, one bounded answer, built on ui/Card.
 * Label (with optional icon anchor) up top, big value in the content, optional
 * quick action in the header corner, optional footer strip for actions.
 */
export function ApexStatCard({
  label,
  description,
  icon: Icon,
  iconClassName,
  action,
  footer,
  className,
  children,
}: {
  label: string
  /** Where the number came from, in a few words. Provenance, not filler. */
  description?: string
  icon?: LucideIcon
  iconClassName?: string
  /** Header-corner slot (menu, small button) */
  action?: React.ReactNode
  /** Muted bottom strip — the card's quick actions live here */
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card size="sm" className={cn("gap-2.5", className)}>
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5 text-xs font-medium">
          {Icon && (
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-md bg-muted [&>svg]:size-3",
                iconClassName
              )}
            >
              <Icon />
            </span>
          )}
          {label}
        </CardDescription>
        {description && (
          <p className="text-[11px] leading-snug text-muted-foreground/80">
            {description}
          </p>
        )}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
      {footer && (
        <CardFooter className="gap-1 px-2 py-1.5">{footer}</CardFooter>
      )}
    </Card>
  )
}

/** The answer — the biggest thing on the card. */
export function ApexStatValue({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "font-heading text-2xl font-semibold tracking-tight tabular-nums",
        className
      )}
      {...props}
    />
  )
}

/**
 * The trailing half of a figure: "of £812.40", "a month", "/100". Rendered
 * inside ApexStatValue so the eye lands on the number that matters and the
 * qualifier reads as a footnote to it rather than as part of the amount.
 */
export function ApexStatUnit({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-sm font-normal tracking-normal text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/** One 13px muted support line — never a paragraph. */
export function ApexStatHint({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("mt-0.5 text-[13px] text-muted-foreground", className)}
      {...props}
    />
  )
}
