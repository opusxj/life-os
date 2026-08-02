import type { Metadata } from "next"

import { ApexPlaceholder } from "@/components/apex/page"

export const metadata: Metadata = { title: "Apex · Life OS" }

export default function ApexOverviewPage() {
  return (
    <ApexPlaceholder
      title="Overview"
      ticket="LIFE-26 · Overview dashboard"
    />
  )
}
