import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import type { Database } from "./types"

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Create a fresh instance per request — never share one across requests.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll from a Server Component is a no-op; middleware
            // (LIFE-17) owns session refresh.
          }
        },
      },
    }
  )
}
