# Life OS — Project Overview

Life OS is a personal/family operating system: one application that manages the domains of everyday life, structured like ClickUp — a module rail, a contextual sidebar per module, and shared concepts of **spaces** (e.g. the Family Space) and **users** (family members with profiles).

## Core concepts

- **Space** — a container for shared life data. The primary space is the Family Space; users may also have personal spaces. Every piece of domain data belongs to exactly one space.
- **User** — a real person with an account (Supabase auth). Users are members of spaces with a role. The profile dropdown (top right) is the user's identity; the space switcher (top left) selects the active space.
- **Module** — an area of life that needs managing. Modules are registered in `lib/modules.ts` (name, slug, icon, accent, sidebar nav) and everything — rail, sidebar, routes, theming — derives from that registry.

## Module map

| Module | Slug | Domain | Status |
|--------|------|--------|--------|
| Home | `/` | Dashboard across all modules | Shell only |
| Apex | `/apex` | Finance: accounts, transactions, budgets, goals | **Built** — six pages live; the Mortgage page is the app-wide design reference |
| Festum | `/festum` | Food: recipes, meal plans, shopping list | Placeholder — spec just-in-time |
| Rete | `/rete` | People: social CRM, circles, important dates | Placeholder — spec just-in-time |
| Medium | `/medium` | Media: library, watch lists, game backlog | Placeholder — spec just-in-time |
| Tempus | `/tempus` | Time: calendar, tasks, reminders, habits | Placeholder — spec just-in-time |

Modules are deliberately **not** broken down upfront. A module gets a spec (`docs/modules/<slug>.md`) and tickets only when it's next in line.

## Architecture

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind v4, shadcn/ui (base-nova / Base UI) — full component set installed in `components/ui`
- **Animation:** Motion (`motion/react`) — springs, layout morphs; reduced-motion respected
- **Data:** Supabase (Postgres, Auth, RLS) — see [data-standards.md](data-standards.md)
- **Shell:** floating panels on a muted canvas — top bar, module rail, contextual sidebar + body panel (`components/shell/`)
- **Tracking:** Linear (canonical since 2026-08-02; [board.md](board.md) is a frozen pre-import archive)

## Roadmap order

1. **Foundations** — Supabase project, auth, spaces/profiles schema, wire the space switcher and profile dropdown to real data
2. **Apex (finance)** — spec, schema, accounts, transactions, budgets, overview
3. **Everything else** — just-in-time, one module at a time, priority decided on the board
