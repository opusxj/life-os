import { cn } from "@/lib/utils"

/**
 * The feature display: a thick half-circle gauge holding its value, and the
 * word for that value directly beneath it, both inside the opening.
 *
 * The arc is sized so a household figure clears the ring by roughly 25px at
 * its widest, which is what lets the caption sit under the number instead of
 * below the whole gauge: close enough to read as one unit, far enough not to
 * crowd the stroke. Reserved for cards whose whole point is the proportion;
 * the default proportional display is SegmentMeter.
 */
export function ArcGauge({
  value,
  label,
  caption,
  arcClassName = "stroke-emerald-500",
  trackClassName = "stroke-emerald-500/15",
  className,
}: {
  /** 0 to 100; clamped, so callers can pass raw percentages */
  value: number
  /** Sits in the arc's opening; the card's real answer */
  label: string
  /** One or two words naming the value, directly under it */
  caption?: string
  arcClassName?: string
  trackClassName?: string
  className?: string
}) {
  const filled = Math.min(100, Math.max(0, value))

  return (
    <div className={cn("relative mx-auto h-[118px] w-52", className)}>
      {/* Fixed px against the same viewBox, so the overlaid label lands in
          the same place whatever the card is doing around it. */}
      <svg width={208} height={118} viewBox="0 0 208 118" aria-hidden>
        <path
          d={ARC}
          fill="none"
          strokeWidth={14}
          strokeLinecap="round"
          className={trackClassName}
        />
        <path
          d={ARC}
          fill="none"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={ARC_LENGTH * (1 - filled / 100)}
          className={arcClassName}
        />
      </svg>

      {/* The opening runs from y=31 (inner edge of the stroke at the apex) to
          the y=110 baseline; this block sits low in it, where the semicircle
          is widest and the figure has the most room. */}
      <div className="absolute inset-x-0 top-[62px] flex flex-col items-center">
        <span className="font-heading text-[22px] leading-7 font-semibold tabular-nums">
          {label}
        </span>
        {caption && (
          <span className="text-[11px] leading-4 text-muted-foreground">
            {caption}
          </span>
        )}
      </div>
    </div>
  )
}

/** Semicircle of radius 86 centred at (104, 110), left end to right end. */
const ARC = "M 18 110 A 86 86 0 0 1 190 110"
const ARC_LENGTH = Math.PI * 86
