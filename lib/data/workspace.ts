import { createServerSupabase } from "@/lib/supabase/server"

export type CurrentUser = {
  id: string
  name: string
  email: string
  initials: string
  avatarUrl: string | null
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

  const name = profile?.display_name ?? user.email?.split("@")[0] ?? "User"

  return {
    id: user.id,
    name,
    email: user.email ?? "",
    initials: initialsOf(name),
    avatarUrl: profile?.avatar_url ?? null,
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
