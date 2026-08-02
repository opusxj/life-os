import { House } from "lucide-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import { AddMortgageButton } from "./add-mortgage-button"

export function MortgageEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <House />
        </EmptyMedia>
        <EmptyTitle>No mortgage yet</EmptyTitle>
        <EmptyDescription>
          {`Add one to track the balance, the rate deadline and the payoff trajectory.`}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <AddMortgageButton />
      </EmptyContent>
    </Empty>
  )
}
