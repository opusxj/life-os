# Conventions

The working system for Life OS: design bar, code rules, and ticket workflow. This is how multiple people/agents work in parallel without stepping on each other or repeating mistakes.

## Design bar

The shell's look and feel is the approved standard ("continue like this"). Every new surface must match it:

- **Reference:** ClickUp's proportions and density. Measure, don't eyeball: rail 56px, top bar 44px, sidebar 240px with 30px rows at 13px text, footer 32px, 8px floating gaps, `rounded-xl` panels.
- **Accents:** each module has an identity color in the registry (`lib/modules.ts` → `accent`). New module surfaces inherit their accent from the registry — never hardcode a color.
- **Motion:** Motion (`motion/react`) springs — the house spring is `{ type: "spring", stiffness: 500, damping: 32 }`. Layout changes morph (`layoutId`), interactions get `whileHover`/`whileTap`. Always inside `MotionConfig reducedMotion="user"`. No CSS `transition-*` on transform properties of motion elements.
- **Components:** use `components/ui` (shadcn base-nova / Base UI) before writing custom. Base UI composes via the `render` prop, not `asChild`.
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
2. **Branch** `los-<ticket>-short-slug` (e.g. `los-12-spaces-schema`). One ticket = one branch = one PR.
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
- 2026-08-02 · Strict `react-hooks/set-state-in-effect` lint errors in generated shadcn files · Generated `components/ui/**` files get lint-rule exceptions in `eslint.config.mjs`; never hand-patch generated files.
