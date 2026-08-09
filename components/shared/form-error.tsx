import type * as React from "react"

import { cn } from "@/lib/utils"

/**
 * The one form-error voice: renders nothing until there is a message, then
 * announces it (role="alert") in the boxed destructive treatment every form
 * uses. `plain` drops the box for tight popovers where a full panel would
 * outweigh the two fields above it.
 */
export function FormError({
  plain,
  className,
  children,
}: {
  plain?: boolean
  className?: string
  children?: React.ReactNode
}) {
  if (!children) return null
  return (
    <p
      role="alert"
      className={cn(
        "text-[13px] text-destructive",
        !plain && "rounded-lg bg-destructive/10 px-3 py-2",
        className
      )}
    >
      {children}
    </p>
  )
}
