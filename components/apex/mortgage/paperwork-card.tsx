import { FileText } from "lucide-react"

import { ApexStatCard } from "@/components/apex/stat-card"
import { formatPence, formatPenceShort } from "@/lib/apex/money"
import type {
  Mortgage,
  MortgageRepaymentType,
} from "@/lib/apex/mortgage/queries"
import { cn } from "@/lib/utils"

import { formatMonthYear, formatShare } from "./format"

/**
 * Every stored fact about the mortgage, visible in one quiet place.
 *
 * An audit found fields we collect but never show anywhere. This card is the
 * fix: no verdicts, no hero figure, its job is completeness, so the user can
 * check what's on file against a statement in one look. The facts sit in
 * three columns because a mortgage statement is really three documents in
 * one: the loan you took, the deal currently pricing it, and the property it
 * is secured on. Each column is named in tinted words from the page
 * vocabulary (sky the committed cost, amber the deal that ends, indigo the
 * asset). Derived figures (balance today, payoff date) belong to the other
 * cards.
 */
export function PaperworkCard({
  mortgage,
  className,
}: {
  mortgage: Mortgage
  className?: string
}) {
  const groups = paperworkGroups(mortgage)

  return (
    <ApexStatCard
      label="The paperwork"
      description="The terms on file for this mortgage"
      icon={FileText}
      className={className}
    >
      {/* The colour lives in the heading words and nowhere else. Washed
          panels read as cards nested in a card, rails as lined sections, and
          pill titles competed with the card's own header; tinted words carry
          the grouping without adding any furniture at all. */}
      <div className="mt-1.5 grid gap-x-5 gap-y-4 sm:grid-cols-3">
        {groups.map((group) => (
          <section key={group.title}>
            <h3 className={cn("text-[12px] font-medium", group.heading)}>
              {group.title}
            </h3>
            <dl className="mt-2.5 space-y-2">
              {group.entries.map((entry) => (
                <div key={entry.label}>
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
          </section>
        ))}
      </div>
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

type PaperworkGroup = {
  title: string
  /** The heading's strong text step of the group's hue, light and dark */
  heading: string
  entries: PaperworkEntry[]
}

function paperworkGroups(mortgage: Mortgage): PaperworkGroup[] {
  const loan: (PaperworkEntry | null)[] = [
    { label: "Lender", value: mortgage.lender },
    {
      label: "Original loan",
      value: formatPenceShort(mortgage.originalAmount),
      numeric: true,
    },
    {
      label: "Repayment type",
      value: REPAYMENT_LABEL[mortgage.repaymentType],
    },
    {
      label: "Term ends",
      value: formatMonthYear(mortgage.termEndsOn),
      numeric: true,
    },
  ]

  const deal: (PaperworkEntry | null)[] = [
    {
      label: "Rate",
      value: `${formatRate(mortgage.interestRate)} ${mortgage.rateType}`,
      numeric: true,
    },
    ratePeriodEntry(mortgage.rateStartedOn, mortgage.rateEndsOn),
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
    // Null stays visible for the same reason: the Overpaying card assumes the
    // norm and points here until it is recorded.
    {
      label: "Overpayment cap",
      value:
        mortgage.overpaymentAllowancePct === null
          ? null
          : `${formatShare(mortgage.overpaymentAllowancePct)}% a year`,
      numeric: true,
    },
  ]

  const property: (PaperworkEntry | null)[] = [
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

  return [
    {
      title: "The loan",
      heading: "text-sky-700 dark:text-sky-400",
      entries: present(loan),
    },
    {
      title: "The deal",
      heading: "text-amber-700 dark:text-amber-400",
      entries: present(deal),
    },
    {
      title: "The property",
      heading: "text-indigo-700 dark:text-indigo-400",
      entries: present(property),
    },
  ]
}

function present(entries: (PaperworkEntry | null)[]): PaperworkEntry[] {
  return entries.filter((entry): entry is PaperworkEntry => entry !== null)
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
 * "April 2022 to March 2027"; a missing start collapses to "To March 2027"
 * rather than inventing one. No dates at all and the row disappears.
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
