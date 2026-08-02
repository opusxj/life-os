import { cookies } from "next/headers"

import { createServerSupabase } from "@/lib/supabase/server"

export const ACTIVE_SPACE_COOKIE = "los-active-space"

export type SpaceRole = "owner" | "admin" | "member" | "guest"

export type CurrentUser = {
  id: string
  name: string
  email: string
  initials: string
  avatarUrl: string | null
}

export type WorkspaceSpace = {
  id: string
  name: string
  kind: "personal" | "shared"
  color: string
  initial: string
}

export type SpaceMember = {
  membershipId: string
  userId: string
  name: string
  initials: string
  role: SpaceRole
  isCurrentUser: boolean
}

export type PendingInvite = {
  id: string
  email: string
  role: string
}

export type MyInvite = {
  id: string
  spaceName: string
  spaceColor: string
  role: string
  invitedByName: string
}

export type Workspace = {
  user: CurrentUser
  spaces: WorkspaceSpace[]
  /** Resolved from the active-space cookie; falls back to the personal space */
  activeSpace: WorkspaceSpace
  /** The signed-in user's role in the active space */
  myRole: SpaceRole
  /** Members of the active space */
  members: SpaceMember[]
  /** Outstanding invites for the active space (owner/admin only, else empty) */
  pendingInvites: PendingInvite[]
  /** Invites addressed to the signed-in user, across all spaces */
  myInvites: MyInvite[]
}

/** The signed-in user's identity, resolved server-side. Null when signed out. */
export async function getCurrentProfile(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .single()

  return toCurrentUser(user.id, user.email, profile?.display_name, profile?.avatar_url)
}

/** Identity, spaces, active-space context and membership in one shot. */
export async function getWorkspace(): Promise<Workspace | null> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: spaceRows }, { data: inviteRows }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single(),
      // RLS already scopes to the user's live (non-deleted) spaces
      supabase
        .from("spaces")
        .select("id, name, kind, color")
        .order("created_at", { ascending: true }),
      supabase.rpc("my_pending_invites"),
    ])

  const spaces: WorkspaceSpace[] = (spaceRows ?? [])
    .map((space) => ({
      id: space.id,
      name: space.name,
      kind: space.kind === "personal" ? ("personal" as const) : ("shared" as const),
      color: space.color,
      initial: (space.name[0] ?? "?").toUpperCase(),
    }))
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "personal" ? -1 : 1))

  // Personal-space invariant guarantees at least one space
  if (spaces.length === 0) return null

  const requested = (await cookies()).get(ACTIVE_SPACE_COOKIE)?.value
  const activeSpace = spaces.find((space) => space.id === requested) ?? spaces[0]

  const { data: memberRows } = await supabase
    .from("space_members")
    .select("id, user_id, role, profiles(display_name)")
    .eq("space_id", activeSpace.id)
    .order("created_at", { ascending: true })

  const members: SpaceMember[] = (memberRows ?? []).map((row) => {
    const name = row.profiles?.display_name ?? "Unknown"
    return {
      membershipId: row.id,
      userId: row.user_id,
      name,
      initials: initialsOf(name),
      role: toRole(row.role),
      isCurrentUser: row.user_id === user.id,
    }
  })

  const myRole =
    members.find((member) => member.isCurrentUser)?.role ?? "member"

  let pendingInvites: PendingInvite[] = []
  if (myRole === "owner" || myRole === "admin") {
    const { data: pending } = await supabase
      .from("space_invites")
      .select("id, email, role")
      .eq("space_id", activeSpace.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
    pendingInvites = pending ?? []
  }

  const myInvites: MyInvite[] = (inviteRows ?? []).map((invite) => ({
    id: invite.id,
    spaceName: invite.space_name,
    spaceColor: invite.space_color,
    role: invite.role,
    invitedByName: invite.invited_by_name,
  }))

  return {
    user: toCurrentUser(user.id, user.email, profile?.display_name, profile?.avatar_url),
    spaces,
    activeSpace,
    myRole,
    members,
    pendingInvites,
    myInvites,
  }
}

function toRole(role: string): SpaceRole {
  return role === "owner" || role === "admin" || role === "guest"
    ? role
    : "member"
}

function toCurrentUser(
  id: string,
  email: string | undefined,
  displayName: string | null | undefined,
  avatarUrl: string | null | undefined
): CurrentUser {
  const name = displayName ?? email?.split("@")[0] ?? "User"
  return {
    id,
    name,
    email: email ?? "",
    initials: initialsOf(name),
    avatarUrl: avatarUrl ?? null,
  }
}

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]!.toUpperCase())
      .join("") || "?"
  )
}
