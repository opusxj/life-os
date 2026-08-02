import { House } from "lucide-react"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 dark:bg-neutral-950">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
          <House className="size-4" />
        </span>
        <span className="text-lg font-semibold tracking-tight">Life OS</span>
      </div>
      <div className="w-full max-w-sm rounded-xl border bg-background p-6 dark:bg-card">
        {children}
      </div>
    </div>
  )
}
