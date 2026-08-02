import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Routes reachable without a session. Signed-in users are bounced back home
// from these (except /auth/* callbacks, which must always run).
const AUTH_PATHS = ["/sign-in", "/sign-up", "/verify", "/forgot-password"]

/**
 * Refreshes the Supabase session on every request (proxy.ts) and enforces
 * route protection: no session → /sign-in; session on an auth page → /.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and auth.getUser() —
  // it can cause hard-to-debug session bugs.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthPage = AUTH_PATHS.some(
    (p) => path === p || path.startsWith(`${p}/`)
  )
  const isAuthCallback = path.startsWith("/auth/")

  if (!user && !isAuthPage && !isAuthCallback) {
    return redirectWithCookies(request, supabaseResponse, "/sign-in")
  }

  if (user && isAuthPage) {
    return redirectWithCookies(request, supabaseResponse, "/")
  }

  return supabaseResponse
}

/** Redirect while preserving any refreshed session cookies. */
function redirectWithCookies(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string
) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ""
  const response = NextResponse.redirect(url)
  supabaseResponse.cookies
    .getAll()
    .forEach((cookie) => response.cookies.set(cookie))
  return response
}
