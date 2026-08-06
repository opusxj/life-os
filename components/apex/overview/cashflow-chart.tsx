"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatPence } from "@/lib/apex/money"
import type { CashflowMonth } from "@/lib/apex/overview/queries"

/**
 * Emerald in, rose out — per-theme steps rather than one hex, so each mode
 * passes CVD separation and surface contrast against its own background.
 * The steps are the Tailwind OKLCH tokens the card's legend rail wears as
 * classes (bg-emerald-700 dark:bg-emerald-600, bg-rose-400 dark:bg-rose-500),
 * so bars and swatches can never drift apart; change both together.
 */
const chartConfig = {
  inflow: {
    label: "In",
    theme: {
      light: "var(--color-emerald-700)",
      dark: "var(--color-emerald-600)",
    },
  },
  outflow: {
    label: "Out",
    theme: {
      light: "var(--color-rose-400)",
      dark: "var(--color-rose-500)",
    },
  },
} satisfies ChartConfig

/**
 * Six months of income vs spend. The plot carries only bars, solid hairline
 * gridlines, and muted axis ticks; naming the marks is the card's legend
 * rail's job, so there is no floating legend strip here.
 */
export function CashflowChart({ months }: { months: CashflowMonth[] }) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[190px] w-full"
    >
      <BarChart accessibilityLayer data={months} barGap={2}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          interval={0}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.longLabel ?? null
              }
              formatter={(value, name, item) => (
                <>
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                    <span className="text-muted-foreground">
                      {chartConfig[name as keyof typeof chartConfig]?.label ??
                        name}
                    </span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatPence(Number(value))}
                    </span>
                  </div>
                </>
              )}
            />
          }
        />
        <Bar
          dataKey="inflow"
          fill="var(--color-inflow)"
          radius={[4, 4, 0, 0]}
          maxBarSize={20}
        />
        <Bar
          dataKey="outflow"
          fill="var(--color-outflow)"
          radius={[4, 4, 0, 0]}
          maxBarSize={20}
        />
      </BarChart>
    </ChartContainer>
  )
}
