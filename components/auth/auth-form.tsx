"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** Shared pieces for the auth screens: heading, field row, error/success notes. */

export function AuthHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-5 space-y-1">
      <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      <p className="text-[13px] text-muted-foreground">{description}</p>
    </div>
  )
}

export function AuthField({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  defaultValue,
  action,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  autoComplete?: string
  defaultValue?: string
  /** Optional inline action rendered to the right of the label */
  action?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="text-[13px]">
          {label}
        </Label>
        {action}
      </div>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
      />
    </div>
  )
}

export function AuthNote({
  kind,
  children,
  className,
}: {
  kind: "error" | "success"
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg px-3 py-2 text-[13px]",
        kind === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        className
      )}
    >
      {children}
    </p>
  )
}
