/**
 * The house spring (docs/conventions.md): the one tuning every interface
 * animation runs on, so a future adjustment lands everywhere at once.
 * Safe to hand to `useSpring` as-is — it spreads options over the same
 * `type: "spring"` this already carries.
 */
export const HOUSE_SPRING = {
  type: "spring",
  stiffness: 500,
  damping: 32,
} as const
