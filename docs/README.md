# Life OS Documentation

Canonical documentation for Life OS. The repo is the source of truth for standards; the board lives in Linear (canonical since 2026-08-02, team `LifeOS`; [board.md](board.md) is the frozen pre-import archive).

**Required reading before working on any ticket:**

1. [project-overview.md](project-overview.md) — what Life OS is, the module map, architecture
2. [data-standards.md](data-standards.md) — how every table must be designed (80% rule, JSONB metadata, RLS)
3. [conventions.md](conventions.md) — design bar, code conventions, ticket workflow, definition of done
4. [board.md](board.md) — the original epic/ticket breakdown (frozen archive; live state is in Linear, and the LOS→LIFE mapping lives at the top of the file)

**Working documents:**

- [codebase-audit.md](codebase-audit.md) — open cleanup findings from the 2026-08-09 five-agent audit (duplication, lib hygiene, design adherence, structure). Pick from it before inventing new cleanup work; strike items as they land.

**Rules of the road:**

- Standards change via PR to these docs, never ad hoc. If you make a decision that isn't covered here, document it here in the same PR.
- Every recurring mistake gets an entry in the [mistake log](conventions.md#recurring-mistake-log) and, if needed, a new rule.
- Module specs live in `docs/modules/<slug>.md` and are written just-in-time, right before a module is built — not upfront.
