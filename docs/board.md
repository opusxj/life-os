# Project Board

Source of truth until Linear is connected; after that, Linear is canonical and this file becomes a mirror/archive. Tickets are agent-sized (one focused session each). Statuses: `Ready` (pickable now), `Blocked (LOS-n)` (dependency), `Later` (refine when its epic is up). Priorities P0 (now) → P3 (someday).

Near-term tickets (E0, E1, top of E2) carry full acceptance criteria. Later tickets are intentionally lighter — they get refined just-in-time when their epic comes up, per our no-upfront-breakdown rule.

---

## E0 — Project setup

| ID | Title | Priority | Size | Status |
|----|-------|----------|------|--------|
| LOS-1 | Connect Linear and import this board | P0 | S | Ready (John) |
| LOS-2 | Create Supabase project + environment wiring | P0 | S | Ready |

**LOS-1 — Connect Linear and import this board**
John connects the Linear MCP connector to Claude Code; agent then creates the team/project, epics as Linear projects/labels, and all tickets below with priorities and dependencies.
*Accept:* all LOS tickets exist in Linear with correct status/priority; board.md marked as mirror.

**LOS-2 — Create Supabase project + environment wiring**
Create the Life OS Supabase project (cost must be confirmed with John), capture URL + publishable key into `.env.local` (git-ignored) with `.env.example` committed.
*Accept:* project reachable; `.env.example` documents required vars; no secrets committed.

---

## E1 — Foundations (family space, users, data correctness)

Everything the modules stand on. Finish before Apex build tickets start.

| ID | Title | Priority | Size | Status |
|----|-------|----------|------|--------|
| LOS-3 | Foundations schema: profiles, spaces, space_members | P0 | M | Blocked (LOS-2) |
| LOS-4 | Supabase client plumbing (server + browser, typed) | P0 | S | Blocked (LOS-2) |
| LOS-5 | Auth: sign-in flow + session + route protection | P0 | M | Blocked (LOS-4) |
| LOS-6 | Profile dropdown on real user data + sign out | P1 | S | Blocked (LOS-5) |
| LOS-7 | Space switcher on real spaces + active-space context | P1 | M | Blocked (LOS-3, LOS-5) |
| LOS-8 | Create-space and invite-member flows | P2 | M | Blocked (LOS-7) |
| LOS-9 | Home sidebar Spaces/Members sections on live data | P2 | S | Blocked (LOS-7) |

**LOS-3 — Foundations schema**
`profiles` (1:1 with auth.users), `spaces`, `space_members` (user, space, role) per [data-standards.md](data-standards.md) — base shape, RLS membership policies, `set_updated_at()` trigger, seed for the Family Space.
*Accept:* schema review checklist passes; RLS verified with two test users; migration applies cleanly.

**LOS-4 — Supabase client plumbing**
`lib/supabase/` server + browser clients, generated TS types, no query code in components.
*Accept:* typed client usable from server components and client components; typecheck passes.

**LOS-5 — Auth flow**
Sign-in/sign-up (email magic link first), session available server-side, unauthenticated users routed to sign-in; shell only renders for signed-in users.
*Accept:* full sign-in/out loop works in the browser; refresh keeps session; protected routes redirect.

**LOS-6 — Profile dropdown live**
Replace `lib/workspace.ts` mock user: real name/email/initials from profile, working sign out, presence dot removed or real.
*Accept:* dropdown shows the signed-in user; sign out returns to sign-in screen.

**LOS-7 — Space switcher live**
Replace mock spaces: fetch user's spaces, switcher sets an active-space context (cookie or store) that all module queries will scope by; persists across reloads.
*Accept:* switching spaces updates context app-wide; last space restored on reload.

**LOS-8 / LOS-9** — refine when unblocked (create/invite UX; live Home sidebar sections).

---

## E2 — Apex (finance tracker) — first module

Spec first, then schema, then UI. Build tickets refine after LOS-10 lands.

| ID | Title | Priority | Size | Status |
|----|-------|----------|------|--------|
| LOS-10 | Apex spec: entities, flows, views (docs/modules/apex.md) | P1 | M | Ready |
| LOS-11 | Apex schema: accounts, categories, transactions | P1 | M | Blocked (LOS-3, LOS-10) |
| LOS-12 | Accounts UI: list, create, edit | P1 | M | Blocked (LOS-11) |
| LOS-13 | Transactions: table, manual entry, filters | P1 | L | Blocked (LOS-12) |
| LOS-14 | Budgets: schema + UI | P2 | M | Later |
| LOS-15 | Overview dashboard: net worth, spend by category | P2 | M | Later |
| LOS-16 | Recurring transactions / subscriptions | P2 | M | Later |
| LOS-17 | CSV bank-statement import | P3 | L | Later |

**LOS-10 — Apex spec**
Written with John: entities and their 80%-rule columns (accounts, categories, transactions; what's metadata), primary flows (add expense, reconcile, monthly review), views per sidebar nav (Overview, Accounts, Transactions, Budgets, Goals). This ticket can run in parallel with E1.
*Accept:* docs/modules/apex.md exists; schema draft passes standards checklist on paper; John signed off.

**LOS-11 — Apex schema**
Migrations for the spec'd tables with RLS, money as integer cents, `metadata` JSONB for one-offs (e.g. a lone plan name).
*Accept:* schema review checklist passes; typed client regenerated.

---

## E3 — Shell & UX backlog

Approved-direction improvements, picked up between module milestones.

| ID | Title | Priority | Size | Status |
|----|-------|----------|------|--------|
| LOS-18 | Ctrl+K command palette (modules, actions, later data) | P2 | M | Ready |
| LOS-19 | Rail notification badge slots (registry-driven) | P3 | S | Later |
| LOS-20 | Rail drag-to-reorder, persisted | P3 | M | Later |
| LOS-21 | Rail compact mode (icon-only, persisted) | P3 | S | Later |
| LOS-22 | Rail module context menu (pin/hide/settings stubs) | P3 | S | Later |
| LOS-23 | Rail↔content directional page transition | P3 | S | Later |
| LOS-24 | Mobile/responsive pass on the shell | P3 | M | Later |

---

## E4–E7 — Future modules (not broken down, by design)

One spec ticket each gets created when the module is prioritized — nothing else upfront.

- **E4 Festum** (food) · **E5 Rete** (people) · **E6 Medium** (media) · **E7 Tempus** (time)
