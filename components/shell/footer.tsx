import { MetaDot } from "@/components/shared/meta-dot"

export function ShellFooter() {
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t px-3.5 text-[11px] text-muted-foreground">
      <span>
        Life OS
        <MetaDot />
        v0.0.1
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        All changes saved
      </span>
    </footer>
  )
}
