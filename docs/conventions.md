# Conventions

The working system for Life OS: design bar, code rules, and ticket workflow. This is how multiple people/agents work in parallel without stepping on each other or repeating mistakes.

## Copy rules

Interface text is part of the product, not decoration around it.

- **Never use an em dash in user-facing copy.** Split the sentence, or use a colon or comma. (Standalone `—` as a "no value" cell placeholder is a symbol, not writing, and is fine.)
- **Never write something the product doesn't do.** "We'll tell you then" promises a notification that doesn't exist. Copy that softens a screen with a claim we can't honour is worse than a blunt sentence, and in a finance tool it costs trust we don't get back.
- **Card shape is title, short description, then the information.** The description says what the card is showing and why; the numbers do the rest.
- **Don't make the biggest text on a card a non-statement.** "Nothing to do yet" as a headline wastes the slot. Lead with the real figure and let the calm framing sit in the description.
- Plain sentences over clever ones. This audience reads decoration as noise.

## Design bar

The shell's look and feel is the approved standard ("continue like this"). Every new surface must match it:

- **Reference:** ClickUp's proportions and density. Measure, don't eyeball: rail 56px, top bar 44px, sidebar 240px with 30px rows at 13px text, footer 32px, 8px floating gaps, `rounded-xl` panels.
- **Accents:** each module has an identity color in the registry (`lib/modules.ts` → `accent`). New module surfaces inherit their accent from the registry — never hardcode a color.
- **Motion:** Motion (`motion/react`) springs — the house spring is `{ type: "spring", stiffness: 500, damping: 32 }`. Layout changes morph (`layoutId`), interactions get `whileHover`/`whileTap`. Always inside `MotionConfig reducedMotion="user"`. No CSS `transition-*` on transform properties of motion elements.
- **Components:** use `components/ui` (shadcn base-nova / Base UI) before writing custom. Base UI composes via the `render` prop, not `asChild`.
- **Module surfaces compose the primitives, not raw markup** (LIFE-32): cards are `ui/Card` (via the shared `components/apex/stat-card.tsx` family for stat-style cards), tables are `ui/Table`, status/kind chips are `ui/Badge`, linear progress is `ui/Progress`, breakdowns use `ui/Separator`, charts use `ui/chart` + recharts. Hand-rolled equivalents don't merge — the one exemption is genuine art (e.g. the bank-card visuals). Cards should feel purposeful, not sparse: icon anchors in headers, quick actions in `CardFooter` strips, totals in `TableFooter` rows.
- **Module bodies are full-width** — no centered max-width container; grids absorb the space with responsive columns.
- **Theme source of truth** (LIFE-35): the tweakcn *claude* theme (`npx shadcn@latest add https://tweakcn.com/r/themes/claude.json`) owns every color/radius/shadow token in `app/globals.css`; next-themes swaps light/dark via the `.dark` class. Local deviations are inline-commented in globals.css (currently: light `--destructive` is a palette-fit red instead of tweakcn's near-black, and `--font-sans`/`--font-mono` stay wired to next/font's Inter + Geist Mono). Never hardcode a surface/text color in a component — data colors (accounts, categories, goals) are the only inline-style colors.
- **Component architecture:** `components/ui/**` is the generated shadcn system (never hand-patched); `components/<module>/**` composes it per module; `components/shared/**` holds the few deliberate cross-module custom controls, each with a comment stating why no primitive fits. Current exemption list: rail motion tiles (signature accent piece), bank-card art, the savings progress grid, `shared/color-swatches`. Selects are always `ui/Select` (in forms: controlled state + hidden input for FormData; pass `items` so the trigger renders labels); segmented choices are `ui/ToggleGroup`.
- **Both themes:** verify light and dark (press `d`).

## Code conventions

- **Registry-driven:** modules, their nav, accents, and routes derive from `lib/modules.ts`. Adding to the shell means adding to the registry, not forking shell components.
- **TypeScript strict; typecheck and lint must pass** (`npm run typecheck`, `npm run lint`).
- Prettier formats (`npm run format`); match existing idioms and comment density (sparse — comments only for non-obvious constraints).
- Server components by default; `"use client"` only where interaction/hooks demand it.
- Data access goes through `lib/` helpers, never inline SQL/queries in components.

## Ticket workflow

Linear is the board (mirrored in [board.md](board.md) until connected). Tickets are **agent-sized**: one focused session, independently shippable.

1. **Pick** a ticket that is `Ready` and unassigned, whose dependencies are done. Assign it to yourself / note the agent claiming it.
2. **Branch** `life-<ticket>-short-slug` (e.g. `life-15-foundations-schema`), matching the Linear identifier. One ticket = one branch = one PR.
3. **Build** within the ticket's stated scope. If you must touch shared files (`lib/modules.ts`, shell components, schema), keep those edits minimal and self-contained — they're the collision hot-spots.
4. **Verify** the definition of done, then commit (conventional style: `feat:`, `fix:`, `docs:`, `chore:`).
5. **Close** with a comment: what shipped, what was verified, any follow-up tickets created.

**Definition of done:**

- [ ] Acceptance criteria on the ticket met
- [ ] `npm run typecheck` and `npm run lint` pass
- [ ] Verified in the running app (browser), light + dark if UI
- [ ] Schema changes pass the [schema review checklist](data-standards.md#schema-review-checklist)
- [ ] Docs updated if a standard/decision changed
- [ ] No unrelated files changed

**Parallel work rules:**

- Two workstreams must not share a branch or ticket.
- Module work stays inside its module's routes/components/tables; foundations work owns the shared shell/schema.
- If a ticket unexpectedly needs a shared-file change, split that change into its own small ticket/PR so others can rebase quickly.

## Recurring-mistake log

When the same mistake happens twice, it gets an entry here and (if warranted) a rule above. Format: date · mistake · rule created.

- 2026-08-02 · JSX trims a significant space between an expression and text on the same line (`{expr} text` rendered without the space) · Interpolate full sentences as one template string instead.
- 2026-08-02 · `INSERT … RETURNING` on `spaces` violated RLS: the creator's owner membership is added by an AFTER trigger, so the RETURNING row couldn't satisfy the membership-based SELECT policy · Any table whose visibility comes from a trigger-created membership row needs `or created_by = auth.uid()` in its SELECT policy — and always test `INSERT … RETURNING` under RLS, since PostgREST's `.insert().select()` does exactly that.
- 2026-08-02 · All top-bar menus crashed on open ("MenuGroupContext is missing") because `DropdownMenuLabel` (Base UI `Menu.GroupLabel`) was used outside `DropdownMenuGroup`; headless automation misread the crash as "popup won't open" · Base UI GroupLabel must be wrapped in a Group — and when a popup fails to appear under automation, check the console/error overlay before blaming the environment.
- 2026-08-02 · Strict `react-hooks/set-state-in-effect` lint errors in generated shadcn files · Generated `components/ui/**` files get lint-rule exceptions in `eslint.config.mjs`; never hand-patch generated files.
- 2026-08-02 · Soft-delete UPDATE rejected by RLS ("new row violates row-level security policy"): Postgres applies the SELECT policy to an UPDATE's new row, so `deleted_at is null` in the select policy blocked soft deletion itself · Select policies use `deleted_at is null or deleted_by = auth.uid()` (standard updated in data-standards.md); `spaces` still has the old shape — LIFE-30 tracks it.
- 2026-08-02 · A spring-animated number looked "stuck" under headless verification and was nearly filed as a bug — `requestAnimationFrame` never ticks in a non-composited Browser pane, so Motion values freeze while plain React renders still update · When verifying animated output headless, assert the un-animated state path (labels, dates, DOM values) and probe rAF before blaming the component.
