import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { createServerSupabase } from "@/lib/supabase/server"

/**
 * Landing point for every email link.
 *
 * Two shapes arrive here and only one used to be handled. Supabase's stock
 * templates send `{{ .ConfirmationURL }}`, which goes to GoTrue's own
 * `/auth/v1/verify` and then redirects here with `?code=…` (this project uses
 * PKCE). `token_hash` only appears if a template is rewritten to use
 * `{{ .TokenHash }}`. Handling `code` alone was the difference between
 * password reset working and never working at all.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/"

  const supabase = await createServerSupabase()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (!error) {
      const destination = type === "recovery" ? "/reset-password" : next
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  return NextResponse.redirect(new URL("/sign-in?error=link", request.url))
}
