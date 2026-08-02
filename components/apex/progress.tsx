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
  className,
  ...props
}: React.ComponentProps<typeof Progress> & {
  value: number
  color: string
  /** Soften the fill (e.g. calm over-budget states) */
  dim?: boolean
}) {
  return (
    <Progress
      value={value}
      className={cn(
        "[&_[data-slot=progress-indicator]]:bg-(--data-color)",
        dim && "[&_[data-slot=progress-indicator]]:opacity-60",
        className
      )}
      style={{ "--data-color": color } as React.CSSProperties}
      {...props}
    />
  )
}
