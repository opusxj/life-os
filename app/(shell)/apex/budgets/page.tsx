import type { Metadata } from "next"

import { ApexPlaceholder } from "@/components/apex/page"

export const metadata: Metadata = { title: "Budgets & Savings · Apex · Life OS" }

export default function BudgetsPage() {
  return (
    <ApexPlaceholder
      title="Budgets & Savings"
      ticket="LIFE-22 · Budgets & Savings"
    />
  )
}
