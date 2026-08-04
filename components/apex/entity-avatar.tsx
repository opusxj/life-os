import * as React from "react"
import {
  ArrowLeftRight,
  Baby,
  Banknote,
  Bus,
  Clapperboard,
  Coins,
  Fuel,
  Gift,
  HeartPulse,
  House,
  Landmark,
  Plane,
  PlugZap,
  RefreshCw,
  Shield,
  ShoppingBag,
  ShoppingBasket,
  Utensils,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * `categories.icon` holds a Lucide kebab name. Mapped explicitly rather than
 * imported dynamically so the bundle only carries the icons we seed — an
 * unknown name simply falls through to the monogram. The last two are ours,
 * for rows that have no category to speak for them.
 */
export const ROW_ICONS: Record<string, LucideIcon | undefined> = {
  "arrow-left-right": ArrowLeftRight,
  "refresh-cw": RefreshCw,
  baby: Baby,
  banknote: Banknote,
  bus: Bus,
  clapperboard: Clapperboard,
  coins: Coins,
  fuel: Fuel,
  gift: Gift,
  "heart-pulse": HeartPulse,
  house: House,
  landmark: Landmark,
  plane: Plane,
  "plug-zap": PlugZap,
  shield: Shield,
  "shopping-bag": ShoppingBag,
  "shopping-basket": ShoppingBasket,
  utensils: Utensils,
}

/**
 * The leading visual of a row: a tinted tile carrying the thing's own icon,
 * falling back to its first letter when there's nothing better. Colour comes
 * from the data (category swatch); the glyph is mixed toward the foreground so
 * it clears contrast on its own tint in both themes.
 *
 * `icon` wins over `label`, and an uploaded image would slot in above both —
 * the chain is deliberately ordered so that extension is additive.
 */
export function EntityAvatar({
  label,
  icon,
  color,
  size = "default",
  className,
  children,
}: {
  /** Supplies the monogram when no icon resolves */
  label: string
  /** A key of `ROW_ICONS`; anything else falls through to the monogram */
  icon?: string | null
  /** Hex from the data; omitted renders neutral */
  color?: string | null
  size?: "default" | "sm"
  className?: string
  /** Badge slot — rendered over the bottom-right corner */
  children?: React.ReactNode
}) {
  const Icon = icon ? ROW_ICONS[icon] : undefined

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-lg bg-(--avatar-bg) font-semibold text-(--avatar-fg)",
        size === "sm"
          ? "size-7 text-[11px] [&>svg]:size-3.5"
          : "size-9 text-[13px] [&>svg]:size-4.5",
        className
      )}
      style={
        {
          "--avatar-bg": color
            ? `color-mix(in srgb, ${color} 16%, transparent)`
            : "var(--color-muted)",
          "--avatar-fg": color
            ? `color-mix(in srgb, ${color} 65%, var(--color-foreground))`
            : "var(--color-muted-foreground)",
        } as React.CSSProperties
      }
    >
      {Icon ? <Icon aria-hidden /> : <span aria-hidden>{monogram(label)}</span>}
      {children}
    </span>
  )
}

/** Corner marker on an avatar — the ring punches it out of the row behind. */
export function AvatarBadge({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      title={title}
      className={cn(
        "absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full ring-2 ring-card [&>svg]:size-2.5",
        className
      )}
    >
      {children}
      <span className="sr-only">{title}</span>
    </span>
  )
}

function monogram(label: string): string {
  const letter = label.trim().charAt(0)
  return letter ? letter.toUpperCase() : "•"
}
