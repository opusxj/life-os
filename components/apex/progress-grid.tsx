"use client"

import { motion, MotionConfig } from "motion/react"

const spring = { type: "spring", stiffness: 500, damping: 32 } as const

/**
 * The savings hero (documented custom-control exemption): the target cut into
 * cells that fill as savings grow. 1% cells for big targets, chunkier cells
 * for small ones; `cells` overrides for compact placements (e.g. the Overview
 * savings strip at 20). Any started goal always shows one confidently full
 * first cell — a £100-into-£5k goal deserves better than a ghost.
 */
export function ProgressGrid({
  target,
  fraction,
  color,
  cells: cellsProp,
  className,
}: {
  target: number
  fraction: number
  color: string
  cells?: number
  className?: string
}) {
  const cells =
    cellsProp ?? (target >= 1_000_000 ? 100 : target >= 100_000 ? 50 : 20)
  const exact = fraction * cells
  const full = Math.floor(exact)
  const hasPartial = full < cells && exact - full > 0.02
  const started = fraction > 0

  return (
    <MotionConfig reducedMotion="user">
      <div
        role="img"
        aria-label={`${Math.floor(fraction * 100)}% of target saved`}
        className={className ?? "grid grid-cols-10 gap-1"}
      >
        {Array.from({ length: cells }, (_, index) => {
          const isFull = index < full || (index === 0 && started)
          const isPartial = !isFull && index === full && hasPartial
          if (!isFull && !isPartial) {
            return (
              <span
                key={index}
                className="aspect-square rounded-[3px] bg-muted"
              />
            )
          }
          return (
            <motion.span
              key={index}
              className="aspect-square rounded-[3px]"
              style={{ backgroundColor: color }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: isPartial ? 0.45 : 1, scale: 1 }}
              transition={{ ...spring, delay: Math.min(index * 0.006, 0.45) }}
            />
          )
        })}
      </div>
    </MotionConfig>
  )
}
