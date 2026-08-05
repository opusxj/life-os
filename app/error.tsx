"use client"

import * as React from "react"
import Link from "next/link"
import { RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * In dev a thrown server error shows a stack overlay; in production it renders
 * a bare grey "Application error" with a digest and no way back. The shell
 * layout awaits the workspace and the Apex sidebar before anything paints, so
 * one Supabase hiccup used to kill every route with no route out.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="max-w-sm space-y-3 text-center">
        <h1 className="font-heading text-lg font-semibold">
          That didn&apos;t load
        </h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong on our side. Nothing you entered has been lost.
        </p>
        <div className="flex justify-center gap-2 pt-1">
          <Button size="sm" onClick={reset}>
            <RotateCw data-icon="inline-start" />
            Try again
          </Button>
          <Button size="sm" variant="outline" render={<Link href="/" />}>
            Go home
          </Button>
        </div>
        {error.digest && (
          <p className="pt-2 font-mono text-[11px] text-muted-foreground/70">
            {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
