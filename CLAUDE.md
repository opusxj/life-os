# Life OS

Personal/family life operating system: ClickUp-style shell (module rail → contextual sidebar → body) with modules as life domains. Next.js 16 · React 19 · Tailwind v4 · shadcn/ui base-nova (Base UI) · Motion · Supabase.

## Required reading (before any work)

- `docs/project-overview.md` — concepts (spaces, users, modules), module map, roadmap
- `docs/data-standards.md` — **80% rule**, JSONB metadata, RLS, schema checklist. No schema merges without it.
- `docs/conventions.md` — design bar, code rules, how work is scoped and shipped, definition of done

There is no ticket board. Work is scoped in conversation and recorded by its
branch, its PR description, and the docs; open future work lives in
`docs/backlog.md` and cleanup findings in `docs/codebase-audit.md`.

## Commands

```bash
npm run dev        # dev server (or use the .claude/launch.json "dev" preview)
npm run typecheck  # must pass before commit
npm run lint       # must pass before commit
```

## Answering a suggestion

A suggestion is an invitation to think, not a work order. Before implementing
one, spend a moment on whether it is the best version of what the person is
actually after: what problem prompted it, and whether a different move serves
that problem better. Then do exactly one of these, out loud:

- **Build it**, when it is plainly the right call.
- **Propose the alternative you would rather do**, with the reason, and let
  them choose. One or two options, not a survey.
- **Say the original is the better call**, and why, when you considered
  something else and it lost.

What is not wanted is silent execution of an idea you had reservations about,
or reservations that only surface after it ships. Disagreement is cheap before
the work and expensive after it.

Proportionality matters, or this becomes noise. A mechanical change ("make it
full width", "rename this") deserves no deliberation. Anything that changes
what a user sees, what the product claims, how data is modelled, or that hides
a semantic mistake behind a cosmetic request, does.

## Hard rules

- **`main` is production** (the family uses the app). Work lands directly on `main`, but **nothing is pushed until the definition of done passes** (typecheck, lint, browser check) — the push is the deploy, so the push is the gate. Conventional commits. Migrations stay deliberate, never drive-by. See conventions.md "Main is live".
- Modules and their nav/accents live in `lib/modules.ts` (registry-driven) — never hardcode module info in shell components.
- Match the approved design bar (density, per-module accents, spring motion, reduced-motion support, light+dark) — see conventions.
- Base UI components compose via `render` prop, not `asChild`. Prefer `components/ui` over custom.
- Verify UI changes in the running browser before calling them done.
- Next.js 16 has breaking changes vs training data — check `node_modules/next/dist/docs/` when unsure (see AGENTS.md).
