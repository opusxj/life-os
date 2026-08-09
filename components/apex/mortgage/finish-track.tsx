"use client"

import { Flag } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const HOUSE_SPRING = { type: "spring", stiffness: 500, damping: 32 } as const

/**
 * A ruler, not a meter. Deliberately a thinner class of graphic than the
 * segment bars elsewhere on the page: it measures a span of years rather than
 * dividing a whole, and a hairline with markers reads as a calendar where a
 * fat rounded bar reads as progress toward a target.
 *
 * Solid to whichever comes first, dashed beyond it, because a dashed run is
 * road that was never meant to be travelled. The flag is planted where the
 * debt clears; the ring is the finish you are measured against. Shared by the
 * Paid off card (static) and the Overpaying card, where the flag rides the
 * slider on the house spring; either way one file owns the furniture, so the
 * page's two rulers cannot drift apart.
 */
export function FinishTrack({
  finishPct,
  markerPct,
  overshoot,
  tone,
  startLabel,
  finishLabel,
  markerTip,
  flagTip,
  label,
}: {
  /** 0 to 100: where the debt clears along the track */
  finishPct: number
  /** 0 to 100: the finish being measured against (term end, or today's pace) */
  markerPct: number
  overshoot: boolean
  tone: "good" | "bad" | "warn"
  startLabel: string
  finishLabel: string
  /** What the ring IS, on hover — a few words */
  markerTip: string
  /** What the flag IS, on hover; omit when the end labels already say it */
  flagTip?: string
  /** One sentence for screen readers describing the whole track */
  label: string
}) {
  const reducedMotion = useReducedMotion()
  const spring = reducedMotion ? { duration: 0 } : HOUSE_SPRING

  const finish = Math.min(100, Math.max(0, finishPct))
  const marker = Math.min(100, Math.max(0, markerPct))
  const solid = Math.min(finish, marker)
  const flagTone =
    tone === "bad"
      ? "text-red-600 dark:text-red-400"
      : tone === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400"

  const flag = (
    <Flag aria-hidden={!flagTip} className={cn("size-4", flagTone)} />
  )

  return (
    <div className="mt-5">
      {/* The right margin is the flag's room, so it never clips at 100% */}
      <div role="img" aria-label={label} className="relative mr-5 h-5">
        {/* Start tick */}
        <span
          aria-hidden
          className="absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-border"
        />

        {/* The run you actually travel */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{ width: `${solid}%` }}
          transition={spring}
          className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-emerald-500"
        />

        {/* Beyond the finish or beyond the marker: road that shouldn't be
            travelled, or road you no longer have to */}
        {finish !== marker && (
          <motion.span
            aria-hidden
            initial={false}
            animate={{
              left: `${solid}%`,
              width: `${Math.abs(finish - marker)}%`,
            }}
            transition={spring}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 border-t-2 border-dashed",
              overshoot ? "border-red-500" : "border-border"
            )}
          />
        )}

        {/* The measured finish: a ring on the line, explaining itself on hover */}
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                className="absolute top-1/2 size-2.5 cursor-help rounded-full border-2 border-foreground/40 bg-card"
                style={{
                  left: `${marker}%`,
                  transform: `translateX(-${marker}%) translateY(-50%)`,
                }}
              />
            }
          />
          <TooltipContent>{markerTip}</TooltipContent>
        </Tooltip>

        {/* The finish: the pole lands on the line, the flag flies right into
            the margin, so it never clips however late the payoff runs */}
        <motion.span
          initial={false}
          animate={{ left: `${finish}%` }}
          transition={spring}
          className="absolute bottom-1/2"
        >
          {flagTip ? (
            <Tooltip>
              <TooltipTrigger render={<span className="cursor-help">{flag}</span>} />
              <TooltipContent>{flagTip}</TooltipContent>
            </Tooltip>
          ) : (
            flag
          )}
        </motion.span>
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{startLabel}</span>
        <span>{finishLabel}</span>
      </div>
    </div>
  )
}
