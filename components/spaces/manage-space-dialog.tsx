"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOut, Trash2, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { Workspace } from "@/lib/data/workspace"
import {
  inviteToSpace,
  leaveSpace,
  removeMember,
  revokeInvite,
  updateMemberRole,
  type SpaceFormState,
} from "@/lib/spaces/actions"

export function ManageSpaceDialog({
  open,
  onOpenChange,
  workspace,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: Workspace
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [actionError, setActionError] = React.useState<string | null>(null)

  const { activeSpace, members, pendingInvites, myRole } = workspace
  const canManage = myRole === "owner" || myRole === "admin"
  const isOwner = myRole === "owner"

  function run(task: () => Promise<{ error?: string }>) {
    setActionError(null)
    startTransition(async () => {
      const result = await task()
      if (result.error) {
        setActionError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="flex size-5.5 items-center justify-center rounded-md text-[10px] font-semibold text-white"
              style={{ backgroundColor: activeSpace.color }}
            >
              {activeSpace.initial}
            </span>
            {activeSpace.name}
          </DialogTitle>
          <DialogDescription>
            {members.length} {members.length === 1 ? "member" : "members"} ·
            your role: {myRole}
          </DialogDescription>
        </DialogHeader>

        {canManage && <InviteForm spaceId={activeSpace.id} />}

        <div className="space-y-px">
          <div className="pb-1 text-[11px] font-medium text-muted-foreground">
            Members
          </div>
          {members.map((member) => (
            <div
              key={member.membershipId}
              className="flex h-9 items-center gap-2.5 rounded-lg px-1.5 text-[13px]"
            >
              <span className="flex size-5.5 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background">
                {member.initials}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {member.name}
                {member.isCurrentUser && (
                  <span className="text-muted-foreground"> — you</span>
                )}
              </span>

              {member.role === "owner" ? (
                <span className="text-[11px] font-medium text-muted-foreground">
                  Owner
                </span>
              ) : isOwner ? (
                <NativeSelect
                  aria-label={`Role for ${member.name}`}
                  className="h-7 w-24 text-[12px]"
                  value={member.role}
                  disabled={isPending}
                  onChange={(event) =>
                    run(() =>
                      updateMemberRole(member.membershipId, event.target.value)
                    )
                  }
                >
                  <NativeSelectOption value="admin">Admin</NativeSelectOption>
                  <NativeSelectOption value="member">Member</NativeSelectOption>
                  <NativeSelectOption value="guest">Guest</NativeSelectOption>
                </NativeSelect>
              ) : (
                <span className="text-[11px] text-muted-foreground capitalize">
                  {member.role}
                </span>
              )}

              {member.isCurrentUser && member.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Leave space"
                  disabled={isPending}
                  onClick={() =>
                    run(async () => {
                      const result = await leaveSpace(activeSpace.id)
                      if (!result.error) onOpenChange(false)
                      return result
                    })
                  }
                >
                  <LogOut />
                </Button>
              )}
              {canManage &&
                !member.isCurrentUser &&
                member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove ${member.name}`}
                    disabled={isPending}
                    onClick={() => run(() => removeMember(member.membershipId))}
                  >
                    <Trash2 />
                  </Button>
                )}
            </div>
          ))}
        </div>

        {canManage && pendingInvites.length > 0 && (
          <div className="space-y-px">
            <div className="pb-1 text-[11px] font-medium text-muted-foreground">
              Pending invites
            </div>
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex h-8 items-center gap-2.5 rounded-lg px-1.5 text-[13px]"
              >
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {invite.email}
                </span>
                <span className="text-[11px] text-muted-foreground capitalize">
                  {invite.role}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Revoke invite for ${invite.email}`}
                  disabled={isPending}
                  onClick={() => run(() => revokeInvite(invite.id))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        )}

        {actionError && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive"
          >
            {actionError}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InviteForm({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [state, action, pending] = React.useActionState<
    SpaceFormState,
    FormData
  >(async (prev, formData) => {
    const result = await inviteToSpace(prev, formData)
    if (result?.success) {
      formRef.current?.reset()
      router.refresh()
    }
    return result
  }, undefined)

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <div className="flex gap-2">
        <input type="hidden" name="spaceId" value={spaceId} />
        <Input
          name="email"
          type="email"
          placeholder="family@example.com"
          aria-label="Invite email"
          required
          className="flex-1"
        />
        <NativeSelect
          name="role"
          defaultValue="member"
          aria-label="Invite role"
          className="w-24"
        >
          <NativeSelectOption value="admin">Admin</NativeSelectOption>
          <NativeSelectOption value="member">Member</NativeSelectOption>
          <NativeSelectOption value="guest">Guest</NativeSelectOption>
        </NativeSelect>
        <Button
          type="submit"
          size="icon"
          aria-label="Create invite"
          disabled={pending}
        >
          <UserPlus />
        </Button>
      </div>
      {/* No email goes out — the invite surfaces in their notifications, and
          only once an account exists on that exact address. Saying "Invite
          sent" left people waiting on an inbox that would never receive it. */}
      <p className="text-[12px] text-muted-foreground">
        They need an account on this address first — the invite then appears in
        their notifications. Nothing is emailed.
      </p>
      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive"
        >
          {state.error}
        </p>
      )}
      {state?.success && (
        <p
          role="status"
          className="text-[13px] text-emerald-600 dark:text-emerald-400"
        >
          Invite created. Check the spelling below — it only reaches an exact
          match.
        </p>
      )}
    </form>
  )
}
