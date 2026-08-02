import type { Metadata } from "next"

import { ApexPlaceholder } from "@/components/apex/page"

export const metadata: Metadata = { title: "Accounts & Cards · Apex · Life OS" }

export default function AccountsPage() {
  return (
    <ApexPlaceholder
      title="Accounts & Cards"
      ticket="LIFE-21 · Accounts UI"
    />
  )
}
