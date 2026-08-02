"use client"

import * as React from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteMortgage } from "@/lib/apex/mortgage/actions"
import type { Mortgage } from "@/lib/apex/mortgage/queries"

import { MortgageDrawer } from "./mortgage-drawer"

/** Card-stack menu: edit reopens the drawer prefilled; delete is soft. */
export function MortgageMenu({ mortgage }: { mortgage: Mortgage }) {
  const [editOpen, setEditOpen] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  // Lazy-mount the drawer so useActionState resets between edits
  const [drawerMounted, setDrawerMounted] = React.useState(false)

  function openEdit() {
    setDrawerMounted(true)
    setEditOpen(true)
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMortgage(mortgage.id)
      if (result.error) {
        setError(result.error)
        return
      }
      setConfirmOpen(false)
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
              aria-label={`Options for ${mortgage.name}`}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={openEdit}>
              <Pencil />
              Edit mortgage
            </DropdownMenuItem>
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

      {drawerMounted && (
        <MortgageDrawer
          open={editOpen}
          onOpenChange={setEditOpen}
          mortgage={mortgage}
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{`Delete ${mortgage.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {`It disappears from the space but stays recoverable — deletion here is always soft.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="text-[13px] text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              size="sm"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending ? "Deleting…" : "Delete mortgage"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
