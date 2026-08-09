"use server"

import { cookies } from "next/headers"

import { ACTIVE_SPACE_COOKIE } from "@/lib/data/workspace"
import { friendlyDbError } from "@/lib/supabase/errors"
import { createServerSupabase } from "@/lib/supabase/server"

export type SpaceFormState = { error?: string; success?: boolean } | undefined

const ASSIGNABLE_ROLES = ["admin", "member", "guest"] as const

export async function setActiveSpace(
  spaceId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()

  // RLS: only spaces the user can see resolve — membership check for free
  const { data } = await supabase
    .from("spaces")
    .select("id")
    .eq("id", spaceId)
    .maybeSingle()
  if (!data) {
    return { error: "Space not found." }
  }

  await persistActiveSpace(spaceId)
  return {}
}

export async function createSpace(
  _prev: SpaceFormState,
  formData: FormData
): Promise<SpaceFormState> {
  const name = String(formData.get("name") ?? "").trim()
  const color = String(formData.get("color") ?? "#8b5cf6")

  if (!name) return { error: "Give the space a name." }
  if (name.length > 60) return { error: "Keep the name under 60 characters." }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  const { data: space, error } = await supabase
    .from("spaces")
    .insert({ name, color, created_by: user.id })
    .select("id")
    .single()

  if (error || !space) {
    // The DB cap trigger raises a descriptive message — surface it as-is
    return { error: friendlyDbError(error?.message) }
  }

  await persistActiveSpace(space.id)
  return { success: true }
}

export async function inviteToSpace(
  _prev: SpaceFormState,
  formData: FormData
): Promise<SpaceFormState> {
  const spaceId = String(formData.get("spaceId") ?? "")
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const role = String(formData.get("role") ?? "member")

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." }
  }
  if (!ASSIGNABLE_ROLES.includes(role as (typeof ASSIGNABLE_ROLES)[number])) {
    return { error: "Invalid role." }
  }

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  const { error } = await supabase.from("space_invites").insert({
    space_id: spaceId,
    email,
    role,
    invited_by: user.id,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "That email already has a pending invite." }
    }
    if (error.code === "42501") {
      return { error: "Only owners and admins can invite people." }
    }
    return { error: friendlyDbError(error.message) }
  }

  return { success: true }
}

export async function respondToInvite(
  inviteId: string,
  response: "accept" | "decline"
): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()

  if (response === "accept") {
    const { error } = await supabase.rpc("accept_space_invite", {
      invite_id: inviteId,
    })
    if (error) return { error: friendlyDbError(error.message) }
    return {}
  }

  const { error } = await supabase
    .from("space_invites")
    .update({ status: "declined" })
    .eq("id", inviteId)
    .eq("status", "pending")
  if (error) return { error: friendlyDbError(error.message) }
  return {}
}

export async function revokeInvite(
  inviteId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from("space_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId)
    .eq("status", "pending")
  if (error) return { error: friendlyDbError(error.message) }
  return {}
}

export async function updateMemberRole(
  membershipId: string,
  role: string
): Promise<{ error?: string }> {
  if (!ASSIGNABLE_ROLES.includes(role as (typeof ASSIGNABLE_ROLES)[number])) {
    return { error: "Invalid role." }
  }

  const supabase = await createServerSupabase()
  // .neq guard: owners are never reassigned (ownership transfer is phase 2)
  const { error } = await supabase
    .from("space_members")
    .update({ role })
    .eq("id", membershipId)
    .neq("role", "owner")
  if (error) return { error: friendlyDbError(error.message) }
  return {}
}

export async function removeMember(
  membershipId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()
  // RLS: non-owner rows only, self or owner/admin of the space
  const { error } = await supabase
    .from("space_members")
    .delete()
    .eq("id", membershipId)
  if (error) return { error: friendlyDbError(error.message) }
  return {}
}

export async function leaveSpace(
  spaceId: string
): Promise<{ error?: string }> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not signed in." }

  // RLS blocks owner rows — personal spaces and owned spaces can't be left
  const { error, count } = await supabase
    .from("space_members")
    .delete({ count: "exact" })
    .eq("space_id", spaceId)
    .eq("user_id", user.id)
  if (error) return { error: friendlyDbError(error.message) }
  if (count === 0) {
    return { error: "Owners can't leave their own space." }
  }

  // If the active space was left, fall back to the personal space next load
  const cookieStore = await cookies()
  if (cookieStore.get(ACTIVE_SPACE_COOKIE)?.value === spaceId) {
    cookieStore.delete(ACTIVE_SPACE_COOKIE)
  }
  return {}
}

async function persistActiveSpace(spaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_SPACE_COOKIE, spaceId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
}

