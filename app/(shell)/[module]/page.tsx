import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getModule, modules } from "@/lib/modules"

export function generateStaticParams() {
  return modules.map((mod) => ({ module: mod.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>
}): Promise<Metadata> {
  const mod = getModule((await params).module)
  return { title: mod ? `${mod.name} · Life OS` : "Life OS" }
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>
}) {
  const mod = getModule((await params).module)
  if (!mod) notFound()

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <mod.icon />
        </EmptyMedia>
        <EmptyTitle>
          {mod.name} · {mod.domain}
        </EmptyTitle>
        <EmptyDescription>
          {`${mod.description} This module hasn't been built yet.`}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" disabled>
          <Plus /> Create
        </Button>
      </EmptyContent>
    </Empty>
  )
}
