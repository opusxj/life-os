import {
  AlarmClock,
  ArrowLeftRight,
  Bell,
  BookOpen,
  Cake,
  CalendarDays,
  CalendarRange,
  ChefHat,
  Contact,
  Film,
  Gamepad2,
  HeartHandshake,
  House,
  Inbox,
  Landmark,
  LayoutDashboard,
  Library,
  ListTodo,
  MessagesSquare,
  Package,
  PiggyBank,
  Repeat,
  ShoppingCart,
  SquareCheck,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type ModuleAccent = {
  /** Rail active tile: background + glow */
  tile: string
  /** Icon color while the module is active on the rail */
  activeIcon: string
  /** Rail label tint while active */
  label: string
}

export type ModuleNavItem = {
  label: string
  icon: LucideIcon
}

export type ModuleNavSection = {
  /** Section heading; omit for the module's primary nav block */
  label?: string
  items: ModuleNavItem[]
  /** Ghost "+ New …" row hinting at what will be created here later */
  placeholder?: string
}

export type LifeModule = {
  /** URL segment; empty string = Home */
  slug: string
  name: string
  /** The area of life this module manages */
  domain: string
  description: string
  icon: LucideIcon
  accent: ModuleAccent
  nav: ModuleNavSection[]
}

export const homeModule: LifeModule = {
  slug: "",
  name: "Home",
  domain: "Everything",
  description: "Your day across every area of life.",
  icon: House,
  accent: {
    tile: "bg-white shadow-lg shadow-white/20",
    activeIcon: "text-neutral-950",
    label: "text-white",
  },
  nav: [
    {
      items: [
        { label: "Inbox", icon: Inbox },
        { label: "My Tasks", icon: ListTodo },
        { label: "Notifications", icon: Bell },
      ],
    },
  ],
}

export const modules: LifeModule[] = [
  {
    slug: "apex",
    name: "Apex",
    domain: "Finances",
    description: "Accounts, budgets and goals for the household.",
    icon: Wallet,
    accent: {
      tile: "bg-emerald-500 shadow-lg shadow-emerald-500/30",
      activeIcon: "text-white",
      label: "text-emerald-300",
    },
    nav: [
      {
        items: [
          { label: "Overview", icon: LayoutDashboard },
          { label: "Accounts", icon: Landmark },
          { label: "Transactions", icon: ArrowLeftRight },
          { label: "Budgets", icon: PiggyBank },
          { label: "Goals", icon: Target },
        ],
      },
      { label: "Accounts", items: [], placeholder: "Add account" },
    ],
  },
  {
    slug: "festum",
    name: "Festum",
    domain: "Food",
    description: "Recipes, meal plans and the shopping list.",
    icon: ChefHat,
    accent: {
      tile: "bg-amber-500 shadow-lg shadow-amber-500/30",
      activeIcon: "text-white",
      label: "text-amber-300",
    },
    nav: [
      {
        items: [
          { label: "Recipes", icon: BookOpen },
          { label: "Meal Plan", icon: CalendarRange },
          { label: "Shopping List", icon: ShoppingCart },
          { label: "Pantry", icon: Package },
        ],
      },
      { label: "Collections", items: [], placeholder: "New collection" },
    ],
  },
  {
    slug: "rete",
    name: "Rete",
    domain: "People",
    description: "Keep up with the people who matter.",
    icon: HeartHandshake,
    accent: {
      tile: "bg-rose-500 shadow-lg shadow-rose-500/30",
      activeIcon: "text-white",
      label: "text-rose-300",
    },
    nav: [
      {
        items: [
          { label: "People", icon: Contact },
          { label: "Circles", icon: Users },
          { label: "Interactions", icon: MessagesSquare },
          { label: "Important Dates", icon: Cake },
        ],
      },
      { label: "Circles", items: [], placeholder: "New circle" },
    ],
  },
  {
    slug: "medium",
    name: "Medium",
    domain: "Media",
    description: "Library, watch lists and the game backlog.",
    icon: Library,
    accent: {
      tile: "bg-violet-500 shadow-lg shadow-violet-500/30",
      activeIcon: "text-white",
      label: "text-violet-300",
    },
    nav: [
      {
        items: [
          { label: "Overview", icon: LayoutDashboard },
          { label: "Books", icon: BookOpen },
          { label: "Watchlist", icon: Film },
          { label: "Games", icon: Gamepad2 },
        ],
      },
      { label: "Shelves", items: [], placeholder: "New shelf" },
    ],
  },
  {
    slug: "tempus",
    name: "Tempus",
    domain: "Time",
    description: "Calendar, tasks, reminders and habits.",
    icon: CalendarDays,
    accent: {
      tile: "bg-sky-500 shadow-lg shadow-sky-500/30",
      activeIcon: "text-white",
      label: "text-sky-300",
    },
    nav: [
      {
        items: [
          { label: "Calendar", icon: CalendarDays },
          { label: "Tasks", icon: SquareCheck },
          { label: "Reminders", icon: AlarmClock },
          { label: "Habits", icon: Repeat },
        ],
      },
      { label: "Lists", items: [], placeholder: "New list" },
    ],
  },
]

export function getModule(slug: string) {
  return modules.find((mod) => mod.slug === slug)
}

/** Resolve the active module from a pathname; falls back to Home. */
export function moduleForPath(pathname: string): LifeModule {
  const [first] = pathname.split("/").filter(Boolean)
  return modules.find((mod) => mod.slug === first) ?? homeModule
}
