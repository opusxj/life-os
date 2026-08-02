"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bell, Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { MyInvite } from "@/lib/data/workspace"
import { respondToInvite } from "@/lib/spaces/actions"

export function NotificationsMenu({ invites }: { invites: MyInvite[] }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  function respond(inviteId: string, response: "accept" | "decline") {
    startTransition(async () => {
      await respondToInvite(inviteId, response)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={
              invites.length > 0
                ? `Notifications (${invites.length})`
                : "Notifications"
            }
            className="relative"
          />
        }
      >
        <Bell />
        {invites.length > 0 && (
          <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-white">
            {invites.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        {invites.length === 0 ? (
          <p className="px-2 py-4 text-center text-[13px] text-muted-foreground">
            {"You're all caught up."}
          </p>
        ) : (
          invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2"
            >
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-white"
                style={{ backgroundColor: invite.spaceColor }}
              >
                {(invite.spaceName[0] ?? "?").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1 text-[13px]">
                <p className="truncate">
                  <span className="font-medium">{invite.invitedByName}</span>{" "}
                  invited you to{" "}
                  <span className="font-medium">{invite.spaceName}</span>
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  as {invite.role}
                </p>
              </div>
              <Button
                size="icon-xs"
                aria-label="Accept invite"
                disabled={isPending}
                onClick={() => respond(invite.id, "accept")}
              >
                <Check />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Decline invite"
                disabled={isPending}
                onClick={() => respond(invite.id, "decline")}
              >
                <X />
              </Button>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
