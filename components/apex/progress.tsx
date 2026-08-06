"use client"

import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * ui/Progress with the indicator taking a data color (category, goal,
 * account). The shared answer to "colored bar" across Apex — promoted from the
 * LIFE-32 overview rework after three areas independently needed it.
 *
 * Ratified dialect (.claude/skills/design): the bar is chunky and rounded,
 * and its track is a pastel step of its own color rather than gray, so state
 * reads across the whole bar. Thin hairline bars are retired.
 */
export function DataProgress({
  value,
  color,
  dim,
  tick,
  tickLabel,
  className,
  ...props
}: React.ComponentProps<typeof Progress> & {
  value: number
  color: string
  /** Soften the fill (e.g. calm over-budget states) */
  dim?: boolean
  /** 0-100: a thin pace marker on the track (e.g. how far through the month) */
  tick?: number
  /**
   * What the tick IS, in a few words, shown on hover ("no mystery pixels",
   * .claude/skills/design). Without it the mark stays a plain span.
   */
  tickLabel?: string
}) {
  return (
    <Progress
      value={value}
      className={cn(
        "relative [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-(--data-color) [&_[data-slot=progress-track]]:h-3.5 [&_[data-slot=progress-track]]:bg-(--data-track)",
        dim && "[&_[data-slot=progress-indicator]]:opacity-60",
        className
      )}
      style={
        {
          "--data-color": color,
          "--data-track": `color-mix(in oklab, ${color} 15%, transparent)`,
        } as React.CSSProperties
      }
      {...props}
    >
      {tick !== undefined &&
        tick >= 0 &&
        tick <= 100 &&
        (tickLabel ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span
                  aria-hidden
                  className="absolute top-1/2 z-10 h-5 w-px -translate-y-1/2 cursor-help bg-foreground/40"
                  style={{ left: `${tick}%` }}
                />
              }
            />
            <TooltipContent>{tickLabel}</TooltipContent>
          </Tooltip>
        ) : (
          <span
            aria-hidden
            className="absolute top-1/2 z-10 h-5 w-px -translate-y-1/2 bg-foreground/40"
            style={{ left: `${tick}%` }}
          />
        ))}
    </Progress>
  )
}
