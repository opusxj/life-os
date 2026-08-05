import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AddMortgageButton } from "@/components/apex/mortgage/add-mortgage-button"
import { MortgageEmpty } from "@/components/apex/mortgage/mortgage-empty"
import { MortgageStack } from "@/components/apex/mortgage/mortgage-stack"
import { todayKey } from "@/components/apex/due-state"
import { ApexPage, ApexPageHeader } from "@/components/apex/page"
import { getMortgages } from "@/lib/apex/mortgage/queries"
import { getWorkspace } from "@/lib/data/workspace"

export const metadata: Metadata = { title: "Mortgage · Apex · Life OS" }

export default async function MortgagePage() {
  const workspace = await getWorkspace()
  if (!workspace) redirect("/sign-in")

  const mortgages = await getMortgages(workspace.activeSpace.id)

  return (
    <ApexPage>
      <ApexPageHeader title="Mortgage">
        {mortgages.length > 0 && <AddMortgageButton />}
      </ApexPageHeader>
      {mortgages.length === 0 ? (
        <MortgageEmpty />
      ) : (
        mortgages.map((mortgage) => (
          <MortgageStack
            key={mortgage.id}
            mortgage={mortgage}
            today={todayKey()}
          />
        ))
      )}
    </ApexPage>
  )
}
