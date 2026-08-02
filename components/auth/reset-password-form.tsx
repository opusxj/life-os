"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { updatePassword, type AuthFormState } from "@/lib/auth/actions"
import { AuthField, AuthHeading, AuthNote } from "./auth-form"

export function ResetPasswordForm() {
  const [state, action, pending] = React.useActionState<AuthFormState, FormData>(
    updatePassword,
    undefined
  )

  return (
    <div>
      <AuthHeading
        title="Set a new password"
        description="You'll stay signed in after saving."
      />

      <form action={action} className="space-y-4">
        <AuthField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <AuthField
          label="Confirm new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
        />
        {state?.error && <AuthNote kind="error">{state.error}</AuthNote>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save password"}
        </Button>
      </form>
    </div>
  )
}
