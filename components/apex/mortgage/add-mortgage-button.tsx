"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { MortgageDrawer } from "./mortgage-drawer"

/**
 * Adding a mortgage happens about once a decade, so on a page that already has
 * one it shrinks to an icon and gives the room to the action people repeat.
 * The full button is for the empty state, where it's the only thing to do.
 */
export function AddMortgageButton({ compact }: { compact?: boolean }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      {compact ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Add mortgage"
                onClick={() => setOpen(true)}
              />
            }
          >
            <Plus />
          </TooltipTrigger>
          <TooltipContent>Add mortgage</TooltipContent>
        </Tooltip>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus data-icon="inline-start" />
          Add mortgage
        </Button>
      )}
      <MortgageDrawer open={open} onOpenChange={setOpen} />
    </>
  )
}
