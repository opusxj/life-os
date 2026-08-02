"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { signUp, type AuthFormState } from "@/lib/auth/actions"
import { AuthField, AuthHeading, AuthNote } from "./auth-form"

export function SignUpForm() {
  const [state, action, pending] = React.useActionState<AuthFormState, FormData>(
    signUp,
    undefined
  )

  return (
    <div>
      <AuthHeading
        title="Create your account"
        description="Your personal space is created automatically."
      />

      <form action={action} className="space-y-4">
        <AuthField label="Name" name="name" placeholder="John" autoComplete="name" />
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
          autoComplete="new-password"
        />
        <AuthField
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
        />
        {state?.error && <AuthNote kind="error">{state.error}</AuthNote>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-[13px] text-muted-foreground">
        Already have an account?{" "}
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
