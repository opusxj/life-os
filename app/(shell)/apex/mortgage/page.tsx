import type { Metadata } from "next"

import { ApexPlaceholder } from "@/components/apex/page"

export const metadata: Metadata = { title: "Mortgage · Apex · Life OS" }

export default function MortgagePage() {
  return (
    <ApexPlaceholder
      title="Mortgage"
      ticket="LIFE-29 · Mortgage cards and what-if"
    />
  )
}
