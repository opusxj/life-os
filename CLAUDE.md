# Life OS

Personal/family life operating system: ClickUp-style shell (module rail → contextual sidebar → body) with modules as life domains. Next.js 16 · React 19 · Tailwind v4 · shadcn/ui base-nova (Base UI) · Motion · Supabase.

## Required reading (before any ticket)

- `docs/project-overview.md` — concepts (spaces, users, modules), module map, roadmap
- `docs/data-standards.md` — **80% rule**, JSONB metadata, RLS, schema checklist. No schema merges without it.
- `docs/conventions.md` — design bar, code rules, ticket workflow, definition of done
- `docs/board.md` — epics/tickets (mirror of Linear once connected)

## Commands

```bash
npm run dev        # dev server (or use the .claude/launch.json "dev" preview)
npm run typecheck  # must pass before commit
npm run lint       # must pass before commit
```

## Hard rules

- Work from a board ticket; one ticket = one branch (`los-<n>-slug`) = one PR; conventional commits.
- Modules and their nav/accents live in `lib/modules.ts` (registry-driven) — never hardcode module info in shell components.
- Match the approved design bar (density, per-module accents, spring motion, reduced-motion support, light+dark) — see conventions.
- Base UI components compose via `render` prop, not `asChild`. Prefer `components/ui` over custom.
- Verify UI changes in the running browser before calling them done.
- Next.js 16 has breaking changes vs training data — check `node_modules/next/dist/docs/` when unsure (see AGENTS.md).
