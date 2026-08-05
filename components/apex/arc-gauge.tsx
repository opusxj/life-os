import { cn } from "@/lib/utils"

/**
 * A half-circle gauge with its answer sitting in the opening.
 *
 * Preferred over a 6px bar wherever a card's whole point is "how far along am
 * I": a bar has to be measured against its own track, an arc reads at a glance.
 * Reserved for proportions of a known whole, never for open-ended amounts.
 */
export function ArcGauge({
  value,
  label,
  caption,
  arcClassName = "stroke-emerald-500",
  className,
}: {
  /** 0 to 100; clamped, so callers can pass raw percentages */
  value: number
  /** Sits in the arc's opening; the card's real answer */
  label: string
  caption?: string
  arcClassName?: string
  className?: string
}) {
  const filled = Math.min(100, Math.max(0, value))

  return (
    <div className={cn("relative mx-auto h-[81px] w-36", className)}>
      {/* Fixed px size rather than viewBox scaling, so the overlaid label lands
          in the same place whatever the card is doing around it. 144x81 against
          a 96x54 box is a uniform 1.5x, which keeps the arc circular. */}
      <svg width={144} height={81} viewBox="0 0 96 54" aria-hidden>
        <path
          d={ARC}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
          className="stroke-muted"
        />
        <path
          d={ARC}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={ARC_LENGTH * (1 - filled / 100)}
          className={arcClassName}
        />
      </svg>

      {/* The opening runs from y=18 (inside edge of the stroke at the apex) to
          y=72 (the baseline). 26px puts the label pair's centre on the
          opening's, rather than resting it on the floor. */}
      <div className="absolute inset-x-0 top-[26px] flex flex-col items-center">
        <span className="font-heading text-xl leading-none font-semibold tabular-nums">
          {label}
        </span>
        {caption && (
          <span className="mt-1 text-[11px] text-muted-foreground">
            {caption}
          </span>
        )}
      </div>
    </div>
  )
}

/** Semicircle of radius 40 centred at (48, 48), left end to right end. */
const ARC = "M 8 48 A 40 40 0 0 1 88 48"
const ARC_LENGTH = Math.PI * 40
