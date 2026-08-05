/**
 * Semantic tints for ApexStatCard icon anchors — one vocabulary across every
 * page so an anchor's color means the same thing wherever it appears.
 * Emerald is reserved for money-good (balances, wins); amber for deadlines.
 */
export const ANCHOR_TINTS = {
  /** Balances, net position, paid-off progress, interest saved */
  balance:
    "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  /** Optional recurring spend */
  subscription:
    "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  /** Committed bills */
  bill: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  /** Deadlines and due dates */
  due: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  /** The asset itself: property value, LTV, equity stakes */
  property:
    "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
  /** The page's single headline answer — the theme's terracotta */
  primary: "bg-primary/10 text-primary",
} as const

export type AnchorTint = keyof typeof ANCHOR_TINTS
