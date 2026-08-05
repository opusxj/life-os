import { FileText } from "lucide-react"

import { ApexStatCard } from "@/components/apex/stat-card"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type {
  Mortgage,
  MortgageRepaymentType,
} from "@/lib/apex/mortgage/queries"
import type { MortgageStatus } from "@/lib/apex/mortgage/status"
import { cn } from "@/lib/utils"

import { formatMonthYear, formatShare } from "./format"

/**
 * Every stored fact about the mortgage, visible in one quiet place.
 *
 * An audit found fields we collect but never show anywhere. This card is the
 * fix: deliberately flat, no verdict, no hero figure. Its job is completeness,
 * so the user can check what's on file against a statement in one look.
 * Derived figures (balance today, payoff date) belong to the other cards.
 */
export function PaperworkCard({
  mortgage,
  className,
}: {
  mortgage: Mortgage
  status: MortgageStatus
  className?: string
}) {
  const entries = paperworkEntries(mortgage)

  return (
    <ApexStatCard
      label="The paperwork"
      description="The terms on file for this mortgage"
      icon={FileText}
      className={className}
    >
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3">
        {entries.map((entry, index) => (
          <div key={`${entry.label}-${index}`}>
            <dt className="text-[11px] leading-snug text-muted-foreground/80">
              {entry.label}
            </dt>
            <dd
              className={cn(
                "mt-0.5 text-[13px] leading-snug",
                entry.numeric && "tabular-nums",
                entry.value === null && "text-muted-foreground italic"
              )}
            >
              {entry.value ?? "Not set"}
            </dd>
          </div>
        ))}
      </dl>
    </ApexStatCard>
  )
}

type PaperworkEntry = {
  label: string
  /** null renders as "Not set" — only rows other cards depend on keep it */
  value: string | null
  /** Money and dates align in columns; words don't need to */
  numeric?: boolean
}

function paperworkEntries(mortgage: Mortgage): PaperworkEntry[] {
  const candidates: (PaperworkEntry | null)[] = [
    { label: "Lender", value: mortgage.lender },
    {
      label: "Original loan",
      value: formatPenceShort(mortgage.originalAmount),
      numeric: true,
    },
    {
      label: "Rate",
      value: `${formatRate(mortgage.interestRate)} ${mortgage.rateType}`,
      numeric: true,
    },
    {
      label: "Monthly payment",
      value: formatPence(mortgage.monthlyPayment),
      numeric: true,
    },
    // Null stays visible: the deal-end card can't show the payment shock
    // without it, so "Not set" here is where the user learns what's missing.
    {
      label: "Reversion rate",
      value:
        mortgage.reversionRate === null
          ? null
          : formatRate(mortgage.reversionRate),
      numeric: true,
    },
    ratePeriodEntry(mortgage.rateStartedOn, mortgage.rateEndsOn),
    {
      label: "Term ends",
      value: formatMonthYear(mortgage.termEndsOn),
      numeric: true,
    },
    { label: "Repayment", value: REPAYMENT_LABEL[mortgage.repaymentType] },
    // Null stays visible: LTV and equity are gated on it.
    {
      label: "Property value",
      value:
        mortgage.propertyValue === null
          ? null
          : formatPenceShort(mortgage.propertyValue),
      numeric: true,
    },
    // A 100% share is sole ownership, which every other row already implies
    mortgage.equitySharePct === null || mortgage.equitySharePct >= 100
      ? null
      : {
          label: "Your share",
          value: `${formatShare(mortgage.equitySharePct)}%`,
          numeric: true,
        },
    mortgage.rentMonthly === null
      ? null
      : {
          label: "Monthly rent",
          value: formatPence(mortgage.rentMonthly),
          numeric: true,
        },
    ...mortgage.extras.map((extra) => ({
      label: extra.label,
      value: `${formatPence(extra.monthly)} a month`,
      numeric: true,
    })),
  ]

  return candidates.filter((entry): entry is PaperworkEntry => entry !== null)
}

/** 4.79 → "4.79%", 4.5 → "4.5%" — no float noise, no trailing zeros */
function formatRate(pct: number): string {
  return `${Number(pct.toFixed(2))}%`
}

const REPAYMENT_LABEL: Record<MortgageRepaymentType, string> = {
  repayment: "Repayment",
  interest_only: "Interest only",
  part_and_part: "Part and part",
}

/**
 * "Apr 2022 to Mar 2027"; a missing start collapses to "To Mar 2027" rather
 * than inventing one. No dates at all and the row disappears.
 */
function ratePeriodEntry(
  start: string | null,
  end: string | null
): PaperworkEntry | null {
  const value =
    start && end
      ? `${formatMonthYear(start)} to ${formatMonthYear(end)}`
      : end
        ? `To ${formatMonthYear(end)}`
        : start
          ? `From ${formatMonthYear(start)}`
          : null
  if (value === null) return null
  return { label: "Rate period", value, numeric: true }
}
