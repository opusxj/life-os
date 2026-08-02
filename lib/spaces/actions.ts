"use server"

import { cookies } from "next/headers"

import { ACTIVE_SPACE_COOKIE } from "@/lib/data/workspace"
import { createServerSupabase } from "@/lib/supabase/server"

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

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_SPACE_COOKIE, spaceId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })

  return {}
}
