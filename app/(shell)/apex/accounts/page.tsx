import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AccountsView } from "@/components/apex/accounts/accounts-view"
import { ApexPage } from "@/components/apex/page"
import { getAccountsWithCards } from "@/lib/apex/accounts/queries"
import { getWorkspace } from "@/lib/data/workspace"

export const metadata: Metadata = { title: "Accounts & Cards · Apex · Life OS" }

export default async function AccountsPage() {
  const workspace = await getWorkspace()
  if (!workspace) redirect("/sign-in")

  const accounts = await getAccountsWithCards(workspace.activeSpace.id)

  return (
    <ApexPage>
      <AccountsView accounts={accounts} spaceId={workspace.activeSpace.id} />
    </ApexPage>
  )
}
