import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * The line above a bar: what it is on the left, what it totals on the right.
 *
 * Shared, because a page of bars only reads as one system if their furniture
 * matches, and it stopped matching the moment a second card wrote its own. Where
 * a bar is a proportion this names the whole it is a proportion of; where it is
 * a length, the quantity. Takes an already-formatted amount so the money
 * vocabulary stays with the card that owns the figure.
 */
export function MeterHead({
  name,
  amount,
  className,
}: {
  name: string
  amount: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "mb-1.5 flex items-baseline justify-between gap-2",
        className
      )}
    >
      <span className="text-[11px] text-muted-foreground">{name}</span>
      <span className="text-[12px] font-medium tabular-nums">{amount}</span>
    </div>
  )
}

export type MeterSegment = {
  /** Share of the whole, 0 to 100 */
  pct: number
  className: string
  /** What this region IS, in one sentence — shown on hover. No mystery pixels. */
  tip: string
}

/**
 * The house proportional display: chunky fully-rounded segments with visible
 * gaps (the ratified dialect's "their bars"). Every segment explains itself
 * on hover, because a colored region nobody can interrogate is decoration.
 * Parts of one whole only; position-on-a-scale stays a custom track.
 */
export function SegmentMeter({
  segments,
  className,
  label,
}: {
  segments: MeterSegment[]
  className?: string
  /** One sentence for screen readers describing the whole bar */
  label: string
}) {
  const visible = segments.filter((segment) => segment.pct > 0)
  if (visible.length === 0) return null

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("flex h-3.5 w-full items-stretch gap-1", className)}
    >
      {visible.map((segment) => (
        <Tooltip key={segment.tip}>
          <TooltipTrigger
            render={
              <span
                className={cn(
                  "h-full cursor-help rounded-full",
                  segment.className
                )}
                style={{ width: `${segment.pct}%` }}
              />
            }
          />
          <TooltipContent>{segment.tip}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
