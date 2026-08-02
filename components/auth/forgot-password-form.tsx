"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { sendPasswordReset, type AuthFormState } from "@/lib/auth/actions"
import { AuthField, AuthHeading, AuthNote } from "./auth-form"

export function ForgotPasswordForm() {
  const [state, action, pending] = React.useActionState<AuthFormState, FormData>(
    sendPasswordReset,
    undefined
  )

  return (
    <div>
      <AuthHeading
        title="Reset your password"
        description="We'll email you a link to set a new one."
      />

      {state?.success ? (
        <AuthNote kind="success">
          If an account exists for that email, a reset link is on its way.
        </AuthNote>
      ) : (
        <form action={action} className="space-y-4">
          <AuthField
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          {state?.error && <AuthNote kind="error">{state.error}</AuthNote>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-[13px] text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
