import { formatPence, formatPenceShort } from "@/lib/apex/money"
import { cn } from "@/lib/utils"

/**
 * A target divided into squares of a round amount, filled as savings grow.
 * Slow money's display: a continuous bar advancing 2% a month is visually
 * motionless, which reads as "nothing is happening"; a square filling in is
 * an event (mortgage.md §3.0 rationale, ratified for goals 2026-08-09).
 * One aria sentence, no per-cell tooltips: the caption already names the
 * unit, and tooltips on forty squares is the "tooltips on everything" the
 * taste log rejects. Local to budgets until a second consumer exists.
 */
export function ProgressGrid({
  target,
  saved,
  color,
  className,
}: {
  /** pence */
  target: number
  saved: number
  /** The goal's own stored hex; fills and track both derive from it */
  color: string
  className?: string
}) {
  if (target <= 0) return null

  const cell = cellSize(target)
  const cells = Math.ceil(target / cell)
  const capped = Math.min(saved, target)

  // Each square fills against its own span. The last square usually covers
  // less than a whole cell (a £35,000 target in £2,000 squares ends on a
  // £1,000 one), and it must still read full at the target — half-filled
  // beside a "Goal reached" tag is the grid lying about done.
  const fill = (index: number) => {
    const start = index * cell
    const span = Math.min(cell, target - start)
    return Math.min(1, Math.max(0, (capped - start) / span))
  }

  const track = `color-mix(in oklab, ${color} 15%, transparent)`

  return (
    <div className={className}>
      <div
        role="img"
        aria-label={`${formatPence(saved)} of ${formatPenceShort(target)} saved; each square is ${formatPenceShort(cell)}.`}
        className="flex flex-wrap gap-[3px]"
      >
        {Array.from({ length: cells }, (_, index) => {
          const fraction = fill(index)
          return (
            <span
              key={index}
              className="size-[15px] rounded-[3px]"
              style={{
                background:
                  fraction >= 1
                    ? color
                    : fraction > 0
                      ? `linear-gradient(90deg, ${color} ${Math.round(fraction * 100)}%, ${track} ${Math.round(fraction * 100)}%)`
                      : track,
              }}
            />
          )
        })}
      </div>
      <p
        aria-hidden
        className={cn(
          "mt-1.5 text-right text-[11px] text-muted-foreground tabular-nums"
        )}
      >
        {`each square is ${formatPenceShort(cell)}`}
      </p>
    </div>
  )
}

/** 1 / 2 / 2.5 / 5 × 10ⁿ, in pence, from £1 up to £5m a square. */
const LADDER = Array.from({ length: 7 }, (_, exponent) =>
  [1, 2, 2.5, 5].map((step) => step * 100 * 10 ** exponent)
).flat()

/**
 * The square worth: target/20 snapped to the round-number ladder (ties take
 * the larger, fewer squares), then stepped until the count sits in 10-40 —
 * enough squares that one filling is progress, few enough that each is worth
 * wanting.
 */
function cellSize(target: number): number {
  const ideal = target / 20
  let index = 0
  for (let i = 0; i < LADDER.length; i++) {
    if (
      Math.abs(LADDER[i] - ideal) < Math.abs(LADDER[index] - ideal) ||
      (Math.abs(LADDER[i] - ideal) === Math.abs(LADDER[index] - ideal) &&
        LADDER[i] > LADDER[index])
    ) {
      index = i
    }
  }
  while (index < LADDER.length - 1 && Math.ceil(target / LADDER[index]) > 40) {
    index++
  }
  while (index > 0 && Math.ceil(target / LADDER[index]) < 10) {
    index--
  }
  return LADDER[index]
}
