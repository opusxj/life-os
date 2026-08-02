/** One glanceable answer per card: big number, one muted support line. */
export function RecurringStatCard({
  label,
  value,
  support,
}: {
  label: string
  value: string
  support: string
}) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="text-[11px] font-medium text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="mt-0.5 truncate text-[13px] text-muted-foreground">
        {support}
      </div>
    </div>
  )
}
