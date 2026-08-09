# Life OS

Personal/family life operating system: ClickUp-style shell (module rail → contextual sidebar → body) with modules as life domains. Next.js 16 · React 19 · Tailwind v4 · shadcn/ui base-nova (Base UI) · Motion · Supabase.

## Required reading (before any work)

- `docs/project-overview.md` — concepts (spaces, users, modules), module map, roadmap
- `docs/data-standards.md` — **80% rule**, JSONB metadata, RLS, schema checklist. No schema merges without it.
- `docs/conventions.md` — design bar, code rules, how work is scoped and shipped, definition of done

There is no ticket board. Linear was retired 2026-08-09 (it slowed the work
down); `docs/board.md` and LIFE-n references in code and docs are frozen
history. Work is scoped in conversation and recorded by its branch, its PR
description, and the docs.

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

- **`main` is production** (the family uses the app); never commit to it directly. One focused change = one branch (`<type>/short-slug`, e.g. `feat/staircasing`) = one PR; conventional commits. See conventions.md "Branches: main is live".
- Modules and their nav/accents live in `lib/modules.ts` (registry-driven) — never hardcode module info in shell components.
- Match the approved design bar (density, per-module accents, spring motion, reduced-motion support, light+dark) — see conventions.
- Base UI components compose via `render` prop, not `asChild`. Prefer `components/ui` over custom.
- Verify UI changes in the running browser before calling them done.
- Next.js 16 has breaking changes vs training data — check `node_modules/next/dist/docs/` when unsure (see AGENTS.md).
