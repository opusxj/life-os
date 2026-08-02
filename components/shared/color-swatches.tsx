"use client"

import { cn } from "@/lib/utils"

/** The six house swatches — spaces, accounts, cards and goals all pick from
 *  the same palette (approved at the Apex sign-off). */
export const SWATCH_COLORS = [
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#0ea5e9",
  "#6b7280",
]

/**
 * Deliberate custom control (documented exemption from the ui-primitives
 * rule): a color picker has no shadcn primitive. Controlled value + hidden
 * input so plain FormData forms serialize it.
 */
export function ColorSwatches({
  name = "color",
  value,
  onChange,
  colors = SWATCH_COLORS,
}: {
  name?: string
  value: string
  onChange: (color: string) => void
  colors?: string[]
}) {
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <div className="flex gap-2">
        {colors.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`Color ${swatch}`}
            aria-pressed={value === swatch}
            onClick={() => onChange(swatch)}
            className={cn(
              "size-6 rounded-full border-2 transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              value === swatch
                ? "scale-110 border-foreground"
                : "border-transparent hover:scale-105"
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
    </>
  )
}
