# Data Standards

How every table in Life OS is designed. Target platform: **Supabase (Postgres)**. These rules exist to keep the schema lean and predictable as many modules each bring their own entities. Schema changes that violate this doc do not merge.

## The 80% rule

**A column must be genuinely used by at least ~80% of rows to justify existing.**

One-off or rare attributes go into the `metadata` JSONB column instead. Canonical example: if Netflix is the only subscription with a plan name ("Premium"), `plan_name` does **not** become a column on `subscriptions` — it goes in that row's `metadata`. If later most subscriptions record a plan name, promote it (see promotion rule).

Corollaries:

- No long free-text "dialogue" columns for one-off context — that's what `notes` is for.
- The rule applies to flags too: don't add `is_archived` until a module actually needs archiving for a meaningful share of rows.
- **Promotion rule:** when a `metadata` key becomes hot — populated on ≥80% of rows, or needed in a `WHERE`/`ORDER BY`/index — promote it to a real column in a migration and backfill from `metadata`.

## Standard table shape

Every domain table gets exactly this base, then its own 80%-rule-passing columns:

```sql
create table public.example_things (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces (id) on delete cascade,
  -- ...domain columns that pass the 80% rule...
  notes       text,                        -- optional; free-form human context
  metadata    jsonb not null default '{}', -- one-off/rare structured attributes
  created_by  uuid not null references public.profiles (id),
  deleted_at  timestamptz,                 -- soft delete; null = live
  deleted_by  uuid references public.profiles (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

- `notes` and `metadata` are the escape hatches; only add them when the module stores that kind of info (the 80% rule applies to them as well).
- `created_by`/`deleted_by` are the audit trail — we always track who added and who deleted (foundations decision, see [foundations.md](foundations.md)).
- **Soft delete is the standard**: user-facing deletion sets `deleted_at` **and** `deleted_by = auth.uid()` in one UPDATE; queries always filter `deleted_at is null`. Hard deletes happen only as system operations — chiefly the space-delete cascade (space removed → all its rows removed via FK).
- **RLS select policies hide deleted rows from everyone except the deleter**: `deleted_at is null or deleted_by = auth.uid()`. A bare `deleted_at is null` blocks soft delete itself — Postgres applies the SELECT policy to an UPDATE's new row (any UPDATE with a WHERE reads the relation), so the freshly-deleted row must remain visible to its updater. Side benefit: an unstamped soft delete is rejected, making the audit trail RLS-enforced. (Found in LIFE-18; see the mistake log.)
- `updated_at` is maintained by the shared `set_updated_at()` trigger — create it with every table.
- **User-scoped exceptions:** `profiles` and `notifications` are identity/infrastructure tables — they hang off the user, not a space, and skip `space_id` and soft delete.

## Naming

- Tables: `snake_case`, **plural** (`accounts`, `transactions`, `space_members`)
- Columns: `snake_case`, singular; foreign keys are `<entity>_id`
- No prefixes per module (`apex_accounts` ❌ → `accounts` ✅); if two modules genuinely collide, the later one qualifies (`media_collections`)
- Booleans read as predicates: `is_shared`, `has_reminder` — and remember the 80% rule before adding any

## Types

- **Money:** `bigint` cents + `currency char(3)` — never `float`/`numeric` dollars
- **Time:** `timestamptz` always; `date` only for true calendar-day values (birthdays, due dates)
- **Deletion:** soft delete via `deleted_at`/`deleted_by` (see standard shape) — no bespoke `is_archived`-style flags
- **Enum-ish values:** `text` + `check` constraint (easy to extend); Postgres `enum` only for values that will truly never change
- **IDs:** `uuid` everywhere, `gen_random_uuid()` default

## Multi-tenancy & RLS

Every domain table carries `space_id` and is protected by row-level security scoped to space membership:

```sql
alter table public.example_things enable row level security;

create policy "members read" on public.example_things
  for select using (
    public.is_space_member(space_id)
    and (deleted_at is null or deleted_by = auth.uid()) -- see soft-delete rule above
  );
-- writes require a writing role (guests are read-only); no delete policy at all,
-- so hard deletes only happen via the space-delete cascade
create policy "writers insert" on public.example_things
  for insert with check (
    public.space_role(space_id) in ('owner', 'admin', 'member') and created_by = auth.uid()
  );
create policy "writers update" on public.example_things
  for update using (
    public.space_role(space_id) in ('owner', 'admin', 'member') and deleted_at is null
  ) with check (public.space_role(space_id) in ('owner', 'admin', 'member'));
```

- No table ships without RLS enabled and policies written.
- Personal-only data still lives in a space (the user's personal space) — one access model everywhere.

## Migrations

- Supabase migrations, one logical change per migration, descriptive names (`create_accounts`, `add_budgets_rollover`)
- Never edit an applied migration; write a new one
- Test locally (`supabase start`) before applying to the remote project when feasible

## Schema review checklist

Run through this for every new/changed table before merging:

- [ ] Every column passes the 80% rule (challenge each one: "will ≥80% of rows fill this?")
- [ ] One-offs are in `metadata`, human context in `notes` — not columns
- [ ] Standard base shape present (`id`, `space_id`, `created_by`, soft-delete columns, timestamps, trigger)
- [ ] Money is integer cents; time is `timestamptz`
- [ ] Naming follows conventions
- [ ] RLS enabled with membership-scoped policies for all verbs used
- [ ] Indexes exist for the queries the module actually runs (and nothing speculative)
- [ ] Migration is additive and singly-scoped
