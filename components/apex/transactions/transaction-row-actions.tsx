"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import { ConfirmDialog } from "@/components/apex/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { softDeleteTransaction } from "@/lib/apex/transactions/actions"
import type { TransactionRow } from "@/lib/apex/transactions/queries"

export function TransactionRowActions({
  transaction,
  canEdit,
  onEdit,
}: {
  transaction: TransactionRow
  /** Adjustments are Sync-balance audit rows — editing one would corrupt history */
  canEdit: boolean
  onEdit: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await softDeleteTransaction(transaction.id)
      if (result.error) setError(result.error)
      else {
        setConfirmOpen(false)
        router.refresh()
      }
    })
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
              className="text-muted-foreground/60"
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuGroup>
            {canEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                setError(null)
                setConfirmOpen(true)
              }}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setError(null)
        }}
        title="Delete this transaction?"
        description="The account balance re-adjusts as if it had never been logged."
        confirmLabel="Delete"
        pending={isPending}
        error={error}
        onConfirm={handleDelete}
      />
    </>
  )
}
