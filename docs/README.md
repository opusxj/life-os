# Life OS Documentation

Canonical documentation for Life OS. The repo is the source of truth for standards. There is no ticket board: work is scoped in conversation and recorded by branches, PR descriptions, and these docs (see [conventions.md](conventions.md)).

**Required reading before any work:**

1. [project-overview.md](project-overview.md) — what Life OS is, the module map, architecture
2. [data-standards.md](data-standards.md) — how every table must be designed (80% rule, JSONB metadata, RLS)
3. [conventions.md](conventions.md) — design bar, code conventions, how work is scoped and shipped, definition of done

**Working documents:**

- [backlog.md](backlog.md) — open future work, plain names, no ticket system
- [codebase-audit.md](codebase-audit.md) — open cleanup findings from the 2026-08-09 five-agent audit (duplication, lib hygiene, design adherence, structure). Pick from it before inventing new cleanup work; strike items as they land.

**Rules of the road:**

- Standards change via PR to these docs, never ad hoc. If you make a decision that isn't covered here, document it here in the same PR.
- Every recurring mistake gets an entry in the [mistake log](conventions.md#recurring-mistake-log) and, if needed, a new rule.
- Module specs live in `docs/modules/<slug>.md` and are written just-in-time, right before a module is built — not upfront.
