"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createServerSupabase } from "@/lib/supabase/server"

export type AuthFormState = { error?: string; success?: boolean } | undefined

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = field(formData, "email")
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Enter your email and password." }
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: error.message }
  }

  redirect("/")
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = field(formData, "name")
  const email = field(formData, "email")
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  if (!name) return { error: "Enter your name." }
  if (!email) return { error: "Enter your email." }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }
  if (password !== confirm) return { error: "Passwords do not match." }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  })
  if (error) {
    return { error: error.message }
  }

  redirect(`/verify?email=${encodeURIComponent(email)}`)
}

export async function verifyEmailOtp(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = field(formData, "email")
  const token = field(formData, "token")

  if (token.length !== 6) {
    return { error: "Enter the 6-digit code from your email." }
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" })
  if (error) {
    return { error: error.message }
  }

  redirect("/")
}

export async function resendVerification(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = field(formData, "email")

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.resend({ type: "signup", email })
  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function sendMagicLink(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = field(formData, "email")

  if (!email) return { error: "Enter your email." }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // Accounts are created through sign-up, not by mistyped magic-link emails.
    options: { shouldCreateUser: false },
  })
  if (error) {
    return { error: error.message }
  }

  redirect(`/verify?email=${encodeURIComponent(email)}&mode=magic`)
}

export async function sendPasswordReset(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = field(formData, "email")

  if (!email) return { error: "Enter your email." }

  const origin = (await headers()).get("origin") ?? "http://localhost:3000"
  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  })
  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }
  if (password !== confirm) return { error: "Passwords do not match." }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: error.message }
  }

  redirect("/")
}

export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect("/sign-in")
}
