"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  sendMagicLink,
  signInWithPassword,
  type AuthFormState,
} from "@/lib/auth/actions"
import { AuthField, AuthHeading, AuthNote } from "./auth-form"

export function SignInForm({ linkError }: { linkError?: boolean }) {
  const [mode, setMode] = React.useState<"password" | "magic">("password")
  const [passwordState, passwordAction, passwordPending] = React.useActionState<
    AuthFormState,
    FormData
  >(signInWithPassword, undefined)
  const [magicState, magicAction, magicPending] = React.useActionState<
    AuthFormState,
    FormData
  >(sendMagicLink, undefined)

  return (
    <div>
      <AuthHeading
        title="Welcome back"
        description={
          mode === "password"
            ? "Sign in to your Life OS."
            : "We'll email you a sign-in code and link."
        }
      />

      {linkError && (
        <AuthNote kind="error" className="mb-4">
          That link is invalid or has expired. Sign in or request a new one.
        </AuthNote>
      )}

      {mode === "password" ? (
        <form action={passwordAction} className="space-y-4">
          <AuthField
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <AuthField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            action={
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </Link>
            }
          />
          {passwordState?.error && (
            <AuthNote kind="error">{passwordState.error}</AuthNote>
          )}
          <Button type="submit" className="w-full" disabled={passwordPending}>
            {passwordPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      ) : (
        <form action={magicAction} className="space-y-4">
          <AuthField
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {magicState?.error && <AuthNote kind="error">{magicState.error}</AuthNote>}
          <Button type="submit" className="w-full" disabled={magicPending}>
            {magicPending ? "Sending…" : "Email me a magic link"}
          </Button>
        </form>
      )}

      <div className="mt-4 space-y-2 text-center text-[13px] text-muted-foreground">
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-[13px] font-normal text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "password" ? "magic" : "password")}
        >
          {mode === "password"
            ? "Use a magic link instead"
            : "Use a password instead"}
        </Button>
        <p>
          No account?{" "}
          <Link
            href="/sign-up"
            className="text-foreground underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
