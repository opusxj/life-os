# Conventions

The working system for Life OS: design bar, code rules, and ticket workflow. This is how multiple people/agents work in parallel without stepping on each other or repeating mistakes.

## Copy and visual design

**`.claude/skills/design/SKILL.md` is the source of truth** for interface
copy, card grammar, the visual dialect, the tint vocabulary, dates, and the
mockup-first design process. It is a skill rather than a doc so it loads
automatically whenever UI work starts.

The two rules worth repeating here because they are absolute:

- **Never use an em dash in user-facing copy.** (A standalone `—` as a "no value" cell placeholder is a symbol, not writing, and is fine.)
- **Never write something the product doesn't do.** Copy that softens a screen with a claim we can't honour is worse than a blunt sentence, and in a finance tool it costs trust we don't get back.

Plain sentences over clever ones. This audience reads decoration as noise.

## Design bar

The shell's look and feel is the approved standard ("continue like this"). Every new surface must match it:

- **Reference:** ClickUp's proportions and density. Measure, don't eyeball: rail 56px, top bar 44px, sidebar 240px with 30px rows at 13px text, footer 32px, 8px floating gaps, `rounded-xl` panels.
- **Accents:** each module has an identity color in the registry (`lib/modules.ts` → `accent`). New module surfaces inherit their accent from the registry — never hardcode a color.
- **Motion:** Motion (`motion/react`) springs — the house spring is `HOUSE_SPRING` (`lib/motion.ts`), `{ type: "spring", stiffness: 500, damping: 32 }`; import it, never redeclare the literal. Layout changes morph (`layoutId`), interactions get `whileHover`/`whileTap`. Always inside `MotionConfig reducedMotion="user"`. No CSS `transition-*` on transform properties of motion elements.
- **Components:** use `components/ui` (shadcn base-nova / Base UI) before writing custom. Base UI composes via the `render` prop, not `asChild`.
- **Module surfaces compose the primitives, not raw markup** (LIFE-32): cards are `ui/Card` (via the shared `components/apex/stat-card.tsx` family for stat-style cards), tables are `ui/Table`, status/kind chips are `ui/Badge`, linear progress is `ui/Progress`, breakdowns use `ui/Separator`, charts use `ui/chart` + recharts. Hand-rolled equivalents don't merge — the one exemption is genuine art (e.g. the bank-card visuals). Cards should feel purposeful, not sparse: icon anchors in headers, quick actions in `CardFooter` strips, totals in `TableFooter` rows.
- **Apex bodies cap at 1100px and centre** (`ApexPage`). Nothing renders full-bleed: meters and charts scale badly across a wide screen, and wide screens should get margins rather than stretched components. Other modules are still full-width until they adopt the same shell.
- **Theme source of truth** (LIFE-35): the tweakcn *claude* theme (`npx shadcn@latest add https://tweakcn.com/r/themes/claude.json`) owns every color/radius/shadow token in `app/globals.css`; next-themes swaps light/dark via the `.dark` class. Local deviations are inline-commented in globals.css (currently: light `--destructive` is a palette-fit red instead of tweakcn's near-black, and `--font-sans`/`--font-mono` stay wired to next/font's Inter + Geist Mono). Never hardcode a surface/text color in a component — data colors (accounts, categories, goals) are the only inline-style colors.
- **Component architecture:** `components/ui/**` is the generated shadcn system (never hand-patched); `components/<module>/**` composes it per module; `components/shared/**` holds the few deliberate cross-module custom controls, each with a comment stating why no primitive fits. Current exemption list: rail motion tiles (signature accent piece), bank-card art, `shared/color-swatches`, `shared/meta-dot`. Apex's own display primitives (`components/apex/meter.tsx`, `arc-gauge.tsx`, and the `stat-card.tsx` family) are documented in the design skill. Selects are always `ui/Select` (in forms: controlled state + hidden input for FormData; pass `items` so the trigger renders labels); segmented choices are `ui/ToggleGroup`.
- **Both themes:** verify light and dark (press `d`).

## Code conventions

- **Registry-driven:** modules, their nav, accents, and routes derive from `lib/modules.ts`. Adding to the shell means adding to the registry, not forking shell components.
- **TypeScript strict; typecheck and lint must pass** (`npm run typecheck`, `npm run lint`).
- Prettier formats (`npm run format`); match existing idioms and comment density (sparse — comments only for non-obvious constraints).
- Server components by default; `"use client"` only where interaction/hooks demand it.
- Data access goes through `lib/` helpers, never inline SQL/queries in components.

## How work is scoped and shipped

There is no ticket board. Linear was retired on 2026-08-09 because the
ceremony (create ticket, shuffle statuses) was slowing the work down without
adding anything the branch, the PR, and the docs don't already record.
[board.md](board.md) and the LIFE-n numbers in code comments and docs are
frozen history; never resurrect them for new work.

What replaces it is the discipline the board enforced, minus the ceremony:

1. **Scope in conversation.** A piece of work is **agent-sized**: one focused
   session, independently shippable. Bigger ambitions get broken down before
   any code.
2. **Branch** (see [Branches](#branches-main-is-live) below):
   `<type>/short-slug`. One focused change = one branch = one PR.
3. **Build** within the agreed scope. If you must touch shared files
   (`lib/modules.ts`, shell components, schema), keep those edits minimal and
   self-contained — they're the collision hot-spots.
4. **Verify** the definition of done, then commit (conventional style:
   `feat:`, `fix:`, `docs:`, `chore:`).
5. **The PR description is the record**: what shipped, what was verified, any
   follow-ups worth naming. Larger open work lives in
   [codebase-audit.md](codebase-audit.md)-style docs, not a board.

## Branches: main is live

The family uses the app day to day, so **`main` is production and must always
be shippable**. Work lands on `main` only through a branch and a PR that has
passed the definition of done. (History note: everything up to 2026-08-09 was
committed straight to `main`; that stops here.)

- **Branch names carry the change type, then a short slug:**
  `<type>/short-slug` — e.g. `feat/staircasing`, `fix/spaces-soft-delete`.
  The type matches the conventional-commit type of the work: `feat` (new
  behaviour), `fix` (something wrong made right), `chore` (tooling, deps,
  config), `docs` (documentation only), `refactor` (no behaviour change).
  (Pre-2026-08-09 branches carry `life-<n>` ticket numbers from the retired
  board; that's history, not the pattern.)
- One focused change = one branch = one PR; rebase on `main` rather than
  merging it in; delete the branch after merge. If a change grows past one
  focused session, split it.
- **Migrations get extra care**: the Supabase project is the live family
  database. A migration merges only with the schema checklist passed, and is
  applied deliberately, never as a drive-by.

**Definition of done:**

- [ ] The agreed scope met (as stated in chat and the PR description)
- [ ] `npm run typecheck` and `npm run lint` pass
- [ ] Verified in the running app (browser), light + dark if UI
- [ ] Schema changes pass the [schema review checklist](data-standards.md#schema-review-checklist)
- [ ] Docs updated if a standard/decision changed
- [ ] No unrelated files changed

**Parallel work rules:**

- Two workstreams must not share a branch.
- Module work stays inside its module's routes/components/tables; foundations work owns the shared shell/schema.
- If a change unexpectedly needs a shared-file edit, split that edit into its own small PR so others can rebase quickly.

## Recurring-mistake log

When the same mistake happens twice, it gets an entry here and (if warranted) a rule above. Format: date · mistake · rule created.

- 2026-08-02 · JSX trims a significant space between an expression and text on the same line (`{expr} text` rendered without the space) · Interpolate full sentences as one template string instead.
- 2026-08-02 · `INSERT … RETURNING` on `spaces` violated RLS: the creator's owner membership is added by an AFTER trigger, so the RETURNING row couldn't satisfy the membership-based SELECT policy · Any table whose visibility comes from a trigger-created membership row needs `or created_by = auth.uid()` in its SELECT policy — and always test `INSERT … RETURNING` under RLS, since PostgREST's `.insert().select()` does exactly that.
- 2026-08-02 · All top-bar menus crashed on open ("MenuGroupContext is missing") because `DropdownMenuLabel` (Base UI `Menu.GroupLabel`) was used outside `DropdownMenuGroup`; headless automation misread the crash as "popup won't open" · Base UI GroupLabel must be wrapped in a Group — and when a popup fails to appear under automation, check the console/error overlay before blaming the environment.
- 2026-08-02 · Strict `react-hooks/set-state-in-effect` lint errors in generated shadcn files · Generated `components/ui/**` files get lint-rule exceptions in `eslint.config.mjs`; never hand-patch generated files.
- 2026-08-02 · Soft-delete UPDATE rejected by RLS ("new row violates row-level security policy"): Postgres applies the SELECT policy to an UPDATE's new row, so `deleted_at is null` in the select policy blocked soft deletion itself · Select policies use `deleted_at is null or deleted_by = auth.uid()` (standard updated in data-standards.md); `spaces` still has the old shape — LIFE-30 tracks it.
- 2026-08-02 · A spring-animated number looked "stuck" under headless verification and was nearly filed as a bug — `requestAnimationFrame` never ticks in a non-composited Browser pane, so Motion values freeze while plain React renders still update · When verifying animated output headless, assert the un-animated state path (labels, dates, DOM values) and probe rAF before blaming the component.
- 2026-08-09 · Every scrolling Apex page silently lost its bottom padding: the shell's `main` is a flex row, so the page div stretched to the viewport and long content overflowed past its own padded box — `pb-10` had never rendered anywhere · A child of a flex scroll container that should size to its content needs `self-start` (ApexPage non-fill now carries it); when padding "isn't showing", measure the box before adding more padding.
