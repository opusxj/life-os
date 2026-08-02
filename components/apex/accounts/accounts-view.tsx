"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Landmark, Plus } from "lucide-react"

import { AccountCard } from "@/components/apex/accounts/account-card"
import { AccountFormSheet } from "@/components/apex/accounts/account-form-sheet"
import { BankCard } from "@/components/apex/accounts/bank-card"
import { CardFormSheet } from "@/components/apex/accounts/card-form-sheet"
import { TransferSheet } from "@/components/apex/accounts/transfer-sheet"
import {
  ApexCardGrid,
  ApexPageHeader,
  ApexSection,
} from "@/components/apex/page"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  deleteAccount,
  deleteCard,
} from "@/lib/apex/accounts/actions"
import type { Account, AccountWithCards } from "@/lib/apex/accounts/queries"

type DeleteTarget =
  | { type: "account"; id: string; name: string }
  | { type: "card"; id: string; name: string }

export function AccountsView({
  accounts,
  spaceId,
}: {
  accounts: AccountWithCards[]
  spaceId: string
}) {
  const router = useRouter()
  const [accountForm, setAccountForm] = React.useState<
    { open: true; account?: Account } | { open: false }
  >({ open: false })
  const [cardForm, setCardForm] = React.useState(false)
  const [transferFrom, setTransferFrom] = React.useState<string | undefined>()
  const [transferOpen, setTransferOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<DeleteTarget | null>(
    null
  )
  const [isPending, startTransition] = React.useTransition()

  const allCards = accounts.flatMap((account) =>
    account.cards.map((card) => ({ card, accountName: account.name }))
  )

  function confirmDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const run = deleteTarget.type === "account" ? deleteAccount : deleteCard
      await run(deleteTarget.id)
      setDeleteTarget(null)
      router.refresh()
    })
  }

  return (
    <>
      <ApexPageHeader title="Accounts & Cards">
        {accounts.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTransferFrom(undefined)
              setTransferOpen(true)
            }}
          >
            Transfer
          </Button>
        )}
        <Button size="sm" onClick={() => setAccountForm({ open: true })}>
          <Plus /> New account
        </Button>
      </ApexPageHeader>

      {accounts.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Landmark />
            </EmptyMedia>
            <EmptyTitle>No accounts yet</EmptyTitle>
            <EmptyDescription>
              {"Add the accounts you actually use — balances take care of themselves."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setAccountForm({ open: true })}>
              <Plus /> New account
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <ApexSection label="Accounts">
            <ApexCardGrid>
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={(target) =>
                    setAccountForm({ open: true, account: target })
                  }
                  onTransfer={(target) => {
                    setTransferFrom(target.id)
                    setTransferOpen(true)
                  }}
                  onDelete={(target) =>
                    setDeleteTarget({
                      type: "account",
                      id: target.id,
                      name: target.name,
                    })
                  }
                />
              ))}
            </ApexCardGrid>
          </ApexSection>

          <ApexSection label="Cards">
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {allCards.map(({ card, accountName }) => (
                <BankCard
                  key={card.id}
                  card={card}
                  accountName={accountName}
                  onDelete={(target) =>
                    setDeleteTarget({
                      type: "card",
                      id: target.id,
                      name: target.name,
                    })
                  }
                />
              ))}
              <button
                type="button"
                onClick={() => setCardForm(true)}
                className="flex aspect-[1.586/1] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-[13px] text-muted-foreground outline-none hover:bg-muted/50 hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <CreditCard className="size-5" />
                Add card
              </button>
            </div>
          </ApexSection>
        </>
      )}

      {accountForm.open && (
        <AccountFormSheet
          key={accountForm.account?.id ?? "new"}
          open
          onOpenChange={(open) => {
            if (!open) setAccountForm({ open: false })
          }}
          spaceId={spaceId}
          account={accountForm.account}
        />
      )}
      <CardFormSheet
        open={cardForm}
        onOpenChange={setCardForm}
        accounts={accounts}
      />
      <TransferSheet
        open={transferOpen}
        onOpenChange={setTransferOpen}
        accounts={accounts}
        fromId={transferFrom}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget ? `Delete ${deleteTarget.name}?` : "Delete"}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === "account"
                ? "It disappears from Apex; its transaction history stays in the ledger."
                : "The card art goes away; transactions it was tagged on are untouched."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={confirmDelete}
            >
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
