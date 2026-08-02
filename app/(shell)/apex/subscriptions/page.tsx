import type { Metadata } from "next"

import { ApexPlaceholder } from "@/components/apex/page"

export const metadata: Metadata = {
  title: "Subscriptions & Bills · Apex · Life OS",
}

export default function SubscriptionsPage() {
  return (
    <ApexPlaceholder
      title="Subscriptions & Bills"
      ticket="LIFE-27 · Recurring payments"
    />
  )
}
