"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { TransactionDrawer } from "@/components/apex/transactions/transaction-drawer"
import { Button } from "@/components/ui/button"
import type { TransactionOptions } from "@/lib/apex/transactions/queries"

/**
 * The sidebar Create button while in Apex: log a transaction from any page,
 * no navigation. Alt+N does the same for keyboard hands.
 */
export function ApexQuickAdd({
  spaceId,
  options,
}: {
  spaceId: string
  options: TransactionOptions
}) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey && event.code === "KeyN") {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <Button size="xs" title="Add transaction (Alt+N)" onClick={() => setOpen(true)}>
        <Plus /> Create
      </Button>
      <TransactionDrawer
        open={open}
        onOpenChange={setOpen}
        spaceId={spaceId}
        options={options}
      />
    </>
  )
}
