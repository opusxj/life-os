"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSpace, type SpaceFormState } from "@/lib/spaces/actions"
import { cn } from "@/lib/utils"

const SPACE_COLORS = [
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#0ea5e9",
  "#6b7280",
]

export function CreateSpaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [color, setColor] = React.useState(SPACE_COLORS[0])
  const [state, action, pending] = React.useActionState<SpaceFormState, FormData>(
    async (prev, formData) => {
      const result = await createSpace(prev, formData)
      if (result?.success) {
        onOpenChange(false)
        router.refresh()
      }
      return result
    },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New space</DialogTitle>
          <DialogDescription>
            {"A shared area of life — you'll be its owner."}
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="space-name" className="text-[13px]">
              Name
            </Label>
            <Input
              id="space-name"
              name="name"
              placeholder="Family Space"
              maxLength={60}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Color</Label>
            <input type="hidden" name="color" value={color} />
            <div className="flex gap-2">
              {SPACE_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  aria-label={`Color ${swatch}`}
                  aria-pressed={color === swatch}
                  onClick={() => setColor(swatch)}
                  className={cn(
                    "size-6 rounded-full border-2 transition-transform",
                    color === swatch
                      ? "scale-110 border-foreground"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          </div>

          {state?.error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
