"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import {
  resendVerification,
  verifyEmailOtp,
  type AuthFormState,
} from "@/lib/auth/actions"
import { AuthHeading, AuthNote } from "./auth-form"

export function VerifyForm({
  email,
  mode,
}: {
  email: string
  mode: "signup" | "magic"
}) {
  const [token, setToken] = React.useState("")
  const [verifyState, verifyAction, verifyPending] = React.useActionState<
    AuthFormState,
    FormData
  >(verifyEmailOtp, undefined)
  const [resendState, resendAction, resendPending] = React.useActionState<
    AuthFormState,
    FormData
  >(resendVerification, undefined)

  return (
    <div>
      <AuthHeading
        title="Check your email"
        description={`Enter the 6-digit code we sent to ${email}. The link in the email works too.`}
      />

      <form action={verifyAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="token" value={token} />
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={token} onChange={setToken}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        {verifyState?.error && <AuthNote kind="error">{verifyState.error}</AuthNote>}
        <Button
          type="submit"
          className="w-full"
          disabled={verifyPending || token.length !== 6}
        >
          {verifyPending ? "Verifying…" : "Verify"}
        </Button>
      </form>

      {mode === "signup" && (
        <form action={resendAction} className="mt-3 text-center">
          <input type="hidden" name="email" value={email} />
          {resendState?.success ? (
            <AuthNote kind="success">A new code is on its way.</AuthNote>
          ) : (
            <button
              type="submit"
              disabled={resendPending}
              className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
            >
              {resendPending ? "Sending…" : "Resend code"}
            </button>
          )}
          {resendState?.error && (
            <AuthNote kind="error" className="mt-2">
              {resendState.error}
            </AuthNote>
          )}
        </form>
      )}
    </div>
  )
}
