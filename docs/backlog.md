# Backlog

Open future work, plain names, no ticket numbers. When a piece starts, it
gets scoped in conversation and shipped per
[conventions.md](conventions.md#how-work-is-scoped-and-shipped). Cleanup-scale
items live in [codebase-audit.md](codebase-audit.md) instead.

## Up next: Accounts & cards redesign

The last of the three page redesigns to the mortgage bar (subscriptions and
budgets landed 2026-08-09). The plan below was produced by a planning agent
and adversarially fact-checked against the code that day; mockup gate first,
as always.

- **Page bar replaces the visible title** (mortgage-page-bar shape, sr-only
  h1): left, a ledger-freshness line ("Last transaction today" / amber
  "Nothing recorded since 24th July" past ~14 days, stated not nagged);
  right, the Transfer and New account actions.
- **Total balance headline card** (terracotta, full width): net across
  accounts with a hint when credit cards owe ("£412.36 owed on credit cards
  is already taken off."); a SegmentMeter of the positive balances, one
  segment per account **in the account's own hex** (segments take a runtime
  `color` since the meter-primitives refactor) — no legend, the account grid
  below is the legend. Suppressed for one-account spaces.
- **Account cards get real provenance**: "Balance, synced 2nd August" when
  the latest row is a sync adjustment, else "Balance, last transaction 5th
  August", else "Balance, nothing recorded yet". Detection: `kind =
  'adjustment'` separates adjustments reliably (users can't create one);
  sync vs starting-balance rides on the app-written description "Balance
  sync". Latest movement per account: one limit(1) query per account over
  transactions, `.or("account_id.eq.X,transfer_account_id.eq.X")`.
- **Credit cards taught calmly**: "£412.36 owed" in normal ink (owing is the
  expected state), "in credit" when positive, destructive only for a
  genuinely overdrawn current account. With an optional recorded limit
  (`metadata.credit_limit_pence`, ask-don't-hedge, drawer field for the
  credit-card kind only) the card gains a DataProgress of used-vs-limit in
  the account's colour, naming "available"; absent, an ApexCardFootnote
  points at the edit drawer.
- **Bank-card art untouched** (documented exemption); thread server `today`
  into bank-card.tsx and parse with parseDay — closes the last client-clock
  audit finding.
- **No signature interactive element, deliberately**: the page has no
  projective question; a toy would be decoration.
- Empty-state copy fix ("Balances take care of themselves." claims unbuilt
  behaviour). Chip caution: terracotta goes via `iconClassName={ANCHOR_TINTS.primary}`,
  never `iconColor` (which expects a hex). Dissolve the all-client
  accounts-view.tsx into server-composed page + client leaves. No migrations.

Then, to close the Apex MVP: an **overview alignment pass** (bring the
dashboard's cards to the same bar and vocabulary the three pages now speak)
and the **module gating** below.

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
