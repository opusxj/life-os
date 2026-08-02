"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { softDeleteTransaction } from "@/lib/apex/transactions/actions"
import type {
  TransactionOptions,
  TransactionRow,
} from "@/lib/apex/transactions/queries"
import { TransactionDrawer } from "./transaction-drawer"

export function TransactionRowActions({
  spaceId,
  options,
  transaction,
}: {
  spaceId: string
  options: TransactionOptions
  transaction: TransactionRow
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [editOpen, setEditOpen] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Adjustments are Sync-balance audit rows — editing one would corrupt history
  const canEdit = transaction.kind !== "adjustment"

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await softDeleteTransaction(transaction.id)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  if (error) {
    return (
      <span role="alert" className="text-[11px] whitespace-nowrap text-destructive">
        {error}
      </span>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={isPending}
              aria-label={`Actions for ${transaction.description}`}
              className="text-muted-foreground opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuGroup>
            {canEdit && (
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {canEdit && (
        <TransactionDrawer
          open={editOpen}
          onOpenChange={setEditOpen}
          spaceId={spaceId}
          options={options}
          transaction={transaction}
        />
      )}
    </>
  )
}
