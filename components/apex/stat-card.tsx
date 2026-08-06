import type { LucideIcon } from "lucide-react"

import { TAG_TINTS, type TagTint } from "@/components/apex/anchor-tints"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * The standard Apex card: one question, one bounded answer, built on ui/Card
 * in the ratified dialect (.claude/skills/design): ~20px padding, 16px
 * radius, a 38px pastel icon chip anchoring a stacked label and provenance
 * line, the figure free-standing below.
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
  /** Where the number came from, in a few words. Provenance, not filler.
   *  Takes nodes so a line can carry a MetaDot between its facts. */
  description?: React.ReactNode
  icon?: LucideIcon
  iconClassName?: string
  /** Header-corner slot (menu, small button, countdown pill) */
  action?: React.ReactNode
  /** Muted bottom strip — the card's quick actions live here */
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <Card
      className={cn("gap-3.5 rounded-2xl [--card-spacing:--spacing(5)]", className)}
    >
      <CardHeader>
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span
              aria-hidden
              className={cn(
                "flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-muted [&>svg]:size-5",
                iconClassName
              )}
            >
              <Icon />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-sm font-medium text-card-foreground">
              {label}
            </span>
            {description && (
              <span className="block truncate text-[12px] leading-snug text-muted-foreground">
                {description}
              </span>
            )}
          </span>
        </div>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      {/* A flex column, so a trailing note can take `mt-auto` and settle at
          the card's base instead of stopping wherever its text ran out.
          Cards in a row then end on the same line however tall they get. */}
      <CardContent className="flex flex-1 flex-col">{children}</CardContent>
      {footer && (
        <CardFooter className="gap-1 px-2.5 py-2">{footer}</CardFooter>
      )}
    </Card>
  )
}

/** The answer — the biggest thing on the card, free of its indicator. */
export function ApexStatValue({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "font-heading text-[26px] leading-8 font-semibold tracking-tight tabular-nums",
        className
      )}
      {...props}
    />
  )
}

/**
 * The trailing half of a figure: "of £812.40", "a month", "still owed".
 * Rendered inside ApexStatValue so the eye lands on the number that matters
 * and the qualifier reads as a footnote to it rather than as part of the
 * amount.
 */
export function ApexStatUnit({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-[13px] font-normal tracking-normal text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * A formatted currency string with its pence faded so the pounds carry the
 * comparison ("faded secondary digits", .claude/skills/design). Splits on the
 * last "."; a string without one renders plain (formatPenceShort drops .00).
 * Renders inside ApexStatValue, which owns the heading type; this span only
 * handles the fade.
 */
export function ApexStatFigure({
  children,
  className,
}: {
  /** An already-formatted amount, e.g. from formatPence/formatPenceShort */
  children: string
  className?: string
}) {
  const dot = children.lastIndexOf(".")
  if (dot === -1) return <span className={className}>{children}</span>
  return (
    <span className={className}>
      {children.slice(0, dot)}
      <span className="text-muted-foreground/60">{children.slice(dot)}</span>
    </span>
  )
}

/**
 * A pastel pill for one piece of discrete data: a date, a delta, a one-fact
 * tag ("5% paid of £150,000"). Sentences stay in ApexStatHint; the pill is
 * for the fact you'd want to pick up between two fingers.
 */
export function ApexStatTag({
  tint = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tint?: TagTint }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-medium tabular-nums",
        TAG_TINTS[tint],
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
