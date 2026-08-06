import { cn } from "@/lib/utils"

/**
 * The separator between facts on one line: "Halifax • repayment mortgage".
 *
 * A rendered element rather than a hard-written "·" so it carries its own
 * size and weight instead of inheriting a glyph that reads as a full stop at
 * 12px, and so screen readers skip it rather than announcing punctuation.
 * Sized against the text via `bg-current`, so it dims with whatever it sits in.
 *
 * String-typed contexts (page titles, select option labels, aria-labels)
 * cannot hold an element and keep the character; that exception is documented
 * in .claude/skills/design.
 */
export function MetaDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mx-1.5 inline-block size-1 shrink-0 rounded-full bg-current align-middle opacity-40",
        className
      )}
    />
  )
}
