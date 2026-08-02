import type { Metadata } from "next"

import { SignUpForm } from "@/components/auth/sign-up-form"

export const metadata: Metadata = {
  title: "Sign up · Life OS",
}

export default function SignUpPage() {
  return <SignUpForm />
}
