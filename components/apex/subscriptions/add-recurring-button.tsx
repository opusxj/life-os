"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { RecurringDrawer } from "@/components/apex/subscriptions/recurring-drawer"
import { Button } from "@/components/ui/button"
import type {
  AccountOption,
  CategoryOption,
} from "@/lib/apex/subscriptions/queries"

export function AddRecurringButton({
  spaceId,
  accounts,
  categories,
}: {
  spaceId: string
  accounts: AccountOption[]
  categories: CategoryOption[]
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus /> Add
      </Button>
      {open && (
        <RecurringDrawer
          open={open}
          onOpenChange={setOpen}
          spaceId={spaceId}
          accounts={accounts}
          categories={categories}
          payment={null}
        />
      )}
    </>
  )
}
