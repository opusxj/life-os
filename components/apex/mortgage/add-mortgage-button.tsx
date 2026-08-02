"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

import { MortgageDrawer } from "./mortgage-drawer"

export function AddMortgageButton() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Add mortgage
      </Button>
      <MortgageDrawer open={open} onOpenChange={setOpen} />
    </>
  )
}
