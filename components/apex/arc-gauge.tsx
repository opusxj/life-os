import { cn } from "@/lib/utils"

/**
 * The feature display: a thick half-circle gauge whose opening holds the
 * value and nothing else. The caption renders BELOW the arc, outside its
 * box — the ratified dialect's fix for "the numbers are a bit tight with
 * the indicator". Reserved for cards whose whole point is the proportion;
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
  /** Sits alone in the arc's opening; the card's real answer */
  label: string
  /** One short line rendered under the arc, clear of the figure */
  caption?: string
  arcClassName?: string
  trackClassName?: string
  className?: string
}) {
  const filled = Math.min(100, Math.max(0, value))

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative h-[100px] w-44">
        {/* Fixed px so the overlaid figure lands identically everywhere;
            176x100 against the same viewBox keeps the arc circular. */}
        <svg width={176} height={100} viewBox="0 0 176 100" aria-hidden>
          <path
            d={ARC}
            fill="none"
            strokeWidth={13}
            strokeLinecap="round"
            className={trackClassName}
          />
          <path
            d={ARC}
            fill="none"
            strokeWidth={13}
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={ARC_LENGTH * (1 - filled / 100)}
            className={arcClassName}
          />
        </svg>
        {/* The opening spans y≈30 (inner stroke edge) to y=93 (baseline);
            centring the 32px line box on y≈72 clears the stroke above and
            keeps the figure off the floor. */}
        <span className="absolute inset-x-0 top-[56px] block text-center font-heading text-[22px] leading-8 font-semibold tabular-nums">
          {label}
        </span>
      </div>
      {caption && (
        <span className="mt-1 text-[12px] text-muted-foreground">
          {caption}
        </span>
      )}
    </div>
  )
}

/** Semicircle of radius 72 centred at (88, 93), left end to right end. */
const ARC = "M 16 93 A 72 72 0 0 1 160 93"
const ARC_LENGTH = Math.PI * 72
