import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="font-heading text-lg font-semibold">
          That page doesn&apos;t exist
        </h1>
        <p className="text-sm text-muted-foreground">
          The link may be out of date, or the page may have moved.
        </p>
        <div className="pt-1">
          <Button size="sm" render={<Link href="/" />}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}
