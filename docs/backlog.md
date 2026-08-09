# Backlog

Open future work, carried out of the retired external tracker (2026-08-09).
Plain names, no ticket numbers. When a piece starts, it gets scoped in
conversation and shipped by branch + PR per
[conventions.md](conventions.md#how-work-is-scoped-and-shipped). Cleanup-scale
items live in [codebase-audit.md](codebase-audit.md) instead.

## Apex (finance)

- **Mortgage staircasing** — model buying further shares on shared ownership
  (equity share and rent change together; event noted in `metadata`)
- **CSV bank-statement import** — with auto-matching of imported rows to
  recurring payments, which would fill Last paid and sharpen price-creep
  detection for free
- **Notifications for due bills and rate expiry** — high-value follow-up; the
  `notifications` table already exists. Until built, no UI copy may promise it.

## Shell and platform

- **Ctrl+K command palette** — modules and actions
- **Mobile/responsive pass** on the shell
- **Rail enhancements** — notification badge slots (registry-driven),
  drag-to-reorder (persisted), compact icon-only mode (persisted), module
  context menu, rail-to-content directional page transition
- **Apex MVP gating** — once Apex is done, grey out / lock the unbuilt modules
  in the shell so the family can't wander into stubs

## Chores

- **spaces soft-delete RLS fix** — `spaces` still has the bare
  `deleted_at is null` select policy (the trap fixed everywhere else); needs
  a careful live-DB migration
- **Normalize line endings** — `.gitattributes` + prettier `endOfLine`, ends
  the constant LF/CRLF warnings
