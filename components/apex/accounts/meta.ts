import {
  Banknote,
  ChartLine,
  CreditCard,
  Landmark,
  PiggyBank,
  type LucideIcon,
} from "lucide-react"

export type AccountKindMeta = {
  value: string
  label: string
  icon: LucideIcon
}

export const ACCOUNT_KINDS: AccountKindMeta[] = [
  { value: "current", label: "Current", icon: Landmark },
  { value: "savings", label: "Savings", icon: PiggyBank },
  { value: "credit_card", label: "Credit card", icon: CreditCard },
  { value: "investment", label: "Investment", icon: ChartLine },
  { value: "cash", label: "Cash", icon: Banknote },
]

export function accountKindMeta(kind: string): AccountKindMeta {
  return ACCOUNT_KINDS.find((meta) => meta.value === kind) ?? ACCOUNT_KINDS[0]
}

/** Same six swatches as spaces — approved at Apex sign-off. */
export const APEX_COLORS = [
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#0ea5e9",
  "#6b7280",
]

export const CARD_BRANDS = [
  { value: "visa", label: "Visa" },
  { value: "mastercard", label: "Mastercard" },
  { value: "amex", label: "Amex" },
  { value: "other", label: "Other" },
]
