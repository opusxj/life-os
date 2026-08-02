# Life OS Documentation

Canonical documentation for Life OS. The repo is the source of truth for standards; the board lives in Linear once connected (until then, [board.md](board.md) is the source).

**Required reading before working on any ticket:**

1. [project-overview.md](project-overview.md) — what Life OS is, the module map, architecture
2. [data-standards.md](data-standards.md) — how every table must be designed (80% rule, JSONB metadata, RLS)
3. [conventions.md](conventions.md) — design bar, code conventions, ticket workflow, definition of done
4. [board.md](board.md) — epics and tickets (mirror of Linear once connected)

**Rules of the road:**

- Standards change via PR to these docs, never ad hoc. If you make a decision that isn't covered here, document it here in the same PR.
- Every recurring mistake gets an entry in the [mistake log](conventions.md#recurring-mistake-log) and, if needed, a new rule.
- Module specs live in `docs/modules/<slug>.md` and are written just-in-time, right before a module is built — not upfront.
