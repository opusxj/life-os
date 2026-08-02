import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { VerifyForm } from "@/components/auth/verify-form"

export const metadata: Metadata = {
  title: "Verify email · Life OS",
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; mode?: string }>
}) {
  const { email, mode } = await searchParams
  if (!email) redirect("/sign-in")

  return <VerifyForm email={email} mode={mode === "magic" ? "magic" : "signup"} />
}
