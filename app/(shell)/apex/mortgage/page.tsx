import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { MortgageEmpty } from "@/components/apex/mortgage/mortgage-empty"
import { MortgagePageBar } from "@/components/apex/mortgage/mortgage-page-bar"
import { MortgageStack } from "@/components/apex/mortgage/mortgage-stack"
import { todayKey } from "@/components/apex/due-state"
import { ApexPage } from "@/components/apex/page"
import { getMortgages } from "@/lib/apex/mortgage/queries"
import { getWorkspace } from "@/lib/data/workspace"

export const metadata: Metadata = { title: "Mortgage · Apex · Life OS" }

export default async function MortgagePage() {
  const workspace = await getWorkspace()
  if (!workspace) redirect("/sign-in")

  const mortgages = await getMortgages(workspace.activeSpace.id)
  const today = todayKey()

  if (mortgages.length === 0) {
    return (
      <ApexPage>
        <h1 className="sr-only">Mortgage</h1>
        <MortgageEmpty />
      </ApexPage>
    )
  }

  return (
    <ApexPage>
      <MortgagePageBar mortgages={mortgages} today={today} />
      {mortgages.map((mortgage) => (
        <MortgageStack
          key={mortgage.id}
          mortgage={mortgage}
          today={today}
          /* With one mortgage the page bar owns the balance action */
          cardBalanceAction={mortgages.length > 1}
        />
      ))}
    </ApexPage>
  )
}
