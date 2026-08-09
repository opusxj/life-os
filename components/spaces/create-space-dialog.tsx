"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { FormError } from "@/components/shared/form-error"
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
import {
  ColorSwatches,
  SWATCH_COLORS,
} from "@/components/shared/color-swatches"
import { createSpace, type SpaceFormState } from "@/lib/spaces/actions"

export function CreateSpaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [color, setColor] = React.useState(SWATCH_COLORS[0])
  const [state, action, pending] = React.useActionState<
    SpaceFormState,
    FormData
  >(async (prev, formData) => {
    const result = await createSpace(prev, formData)
    if (result?.success) {
      onOpenChange(false)
      router.refresh()
    }
    return result
  }, undefined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New space</DialogTitle>
          <DialogDescription>
            {"A shared area of life. You'll be its owner."}
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
            <ColorSwatches value={color} onChange={setColor} />
          </div>

          <FormError>{state?.error}</FormError>

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
