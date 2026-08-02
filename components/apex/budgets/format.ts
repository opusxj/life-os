import { formatPence } from "@/lib/apex/money"

const gbpWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
})

/** Whole-pound amounts drop the ".00" — bars and cards read cleaner. */
export function formatPenceShort(pence: number): string {
  return pence % 100 === 0 ? gbpWhole.format(pence / 100) : formatPence(pence)
}
