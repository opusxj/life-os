import { cookies } from "next/headers"

import { createServerSupabase } from "@/lib/supabase/server"

export const ACTIVE_SPACE_COOKIE = "los-active-space"

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

export type Workspace = {
  user: CurrentUser
  spaces: WorkspaceSpace[]
  /** Resolved from the active-space cookie; falls back to the personal space */
  activeSpace: WorkspaceSpace
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

/** Identity + spaces + active space in one round trip set. Null when signed out. */
export async function getWorkspace(): Promise<Workspace | null> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: spaceRows }] = await Promise.all([
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

  return {
    user: toCurrentUser(user.id, user.email, profile?.display_name, profile?.avatar_url),
    spaces,
    activeSpace,
  }
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
