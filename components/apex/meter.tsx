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
 * vocabulary stays with the card that owns the figure. `leading` sits before
 * the name (an identity dot) and `trailing` after it (an over-tag), both free
 * nodes on the same baseline row; legend swatches belong to MeterLegendRow,
 * never here.
 */
export function MeterHead({
  name,
  amount,
  leading,
  trailing,
  className,
  nameClassName,
  amountClassName,
}: {
  name: string
  /** Already formatted; a multi-tone node is a valid amount */
  amount?: React.ReactNode
  leading?: React.ReactNode
  /** Give it ml-auto when it sits between the name and a right-anchored amount */
  trailing?: React.ReactNode
  className?: string
  nameClassName?: string
  amountClassName?: string
}) {
  return (
    <div
      className={cn(
        "mb-1.5 flex items-baseline justify-between gap-2",
        className
      )}
    >
      {leading}
      <span className={cn("text-[11px] text-muted-foreground", nameClassName)}>
        {name}
      </span>
      {trailing}
      {amount != null && (
        <span
          className={cn("text-[12px] font-medium tabular-nums", amountClassName)}
        >
          {amount}
        </span>
      )}
    </div>
  )
}

/**
 * The small square that ties a legend row to its segment. Shared for the same
 * reason as MeterHead: legend furniture that matches across cards is what lets
 * two meters on one page read as one system.
 */
export function MeterSwatch({
  className,
  color,
}: {
  className?: string
  /** Runtime hex, for swatches tied to entity-coloured segments */
  color?: string
}) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-[3px]", className)}
      style={color ? { backgroundColor: color } : undefined}
    />
  )
}

/**
 * One breakdown legend entry: the swatch that ties the row to its segment,
 * a truncating label left, the amount right.
 */
export function MeterLegendRow({
  label,
  amount,
  swatchClassName,
  swatchColor,
}: {
  label: string
  /** Already formatted, same as MeterHead */
  amount: string
  swatchClassName?: string
  /** Runtime hex, for entity-coloured segments */
  swatchColor?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
        <MeterSwatch className={swatchClassName} color={swatchColor} />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 text-[13px] font-medium tabular-nums">
        {amount}
      </span>
    </div>
  )
}

/**
 * The total row in the legend's own grammar: an outline swatch because it is
 * all of the above rather than one slice. Content only, so it composes inside
 * `ApexCardFootnote asRow`, which owns the hairline and the base-pinning.
 */
export function MeterTotalRow({
  label,
  amount,
}: {
  label: string
  amount: string
}) {
  return (
    <>
      <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <MeterSwatch className="border-[1.5px] border-muted-foreground/50" />
        {label}
      </span>
      <span className="shrink-0 text-[13px] font-medium tabular-nums">
        {amount}
      </span>
    </>
  )
}

/** A segment is painted by exactly one of a Tailwind class or a runtime hex. */
export type MeterSegment = {
  /** Share of the whole, 0 to 100 */
  pct: number
  /** What this region IS, in one sentence — shown on hover. No mystery pixels. */
  tip: string
} & ({ className: string; color?: never } | { color: string; className?: never })

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
          {/* min-w keeps a small share findable: a 1-2% segment renders a few
              pixels wide and reads as nothing at all, which fails the bar's
              one job. The tooltip still tells the true share. */}
          <TooltipTrigger
            render={
              <span
                className={cn(
                  "h-full min-w-2.5 cursor-help rounded-full",
                  segment.className
                )}
                style={{
                  width: `${segment.pct}%`,
                  backgroundColor: segment.color,
                }}
              />
            }
          />
          <TooltipContent>{segment.tip}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
