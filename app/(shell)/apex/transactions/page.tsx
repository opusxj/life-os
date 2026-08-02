import type { Metadata } from "next"

import { ApexPlaceholder } from "@/components/apex/page"

export const metadata: Metadata = { title: "Transactions · Apex · Life OS" }

export default function TransactionsPage() {
  return (
    <ApexPlaceholder
      title="Transactions"
      ticket="LIFE-25 · Transactions table and entry"
    />
  )
}
