"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

/**
 * ui/Progress with the indicator taking a data color (category, goal,
 * account). The shared answer to "colored bar" across Apex — promoted from the
 * LIFE-32 overview rework after three areas independently needed it.
 */
export function DataProgress({
  value,
  color,
  dim,
  tick,
  className,
  ...props
}: React.ComponentProps<typeof Progress> & {
  value: number
  color: string
  /** Soften the fill (e.g. calm over-budget states) */
  dim?: boolean
  /** 0-100: a thin pace marker on the track (e.g. how far through the month) */
  tick?: number
}) {
  return (
    <Progress
      value={value}
      className={cn(
        "relative [&_[data-slot=progress-indicator]]:bg-(--data-color)",
        dim && "[&_[data-slot=progress-indicator]]:opacity-60",
        className
      )}
      style={{ "--data-color": color } as React.CSSProperties}
      {...props}
    >
      {tick !== undefined && tick >= 0 && tick <= 100 && (
        <span
          aria-hidden
          className="absolute top-1/2 z-10 h-2.5 w-px -translate-y-1/2 bg-foreground/40"
          style={{ left: `${tick}%` }}
        />
      )}
    </Progress>
  )
}
