import { House, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { currentUser } from "@/lib/workspace"

export default function HomePage() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <House />
        </EmptyMedia>
        <EmptyTitle>Welcome home, {currentUser.name}</EmptyTitle>
        <EmptyDescription>
          Your day across every area of life will live here — money, meals,
          people, media and time.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          <UserPlus /> Invite people
        </Button>
      </EmptyContent>
    </Empty>
  )
}
