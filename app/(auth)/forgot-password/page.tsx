import type { Metadata } from "next"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Reset password · Life OS",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
