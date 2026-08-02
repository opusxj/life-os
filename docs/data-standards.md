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
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

- `notes` and `metadata` are the escape hatches; only add them when the module stores that kind of info (the 80% rule applies to them as well).
- `created_by uuid references public.profiles (id)` — add only when "who created this" matters for the module.
- `updated_at` is maintained by the shared `set_updated_at()` trigger — create it with every table.

## Naming

- Tables: `snake_case`, **plural** (`accounts`, `transactions`, `space_members`)
- Columns: `snake_case`, singular; foreign keys are `<entity>_id`
- No prefixes per module (`apex_accounts` ❌ → `accounts` ✅); if two modules genuinely collide, the later one qualifies (`media_collections`)
- Booleans read as predicates: `is_shared`, `has_reminder` — and remember the 80% rule before adding any

## Types

- **Money:** `bigint` cents + `currency char(3)` — never `float`/`numeric` dollars
- **Time:** `timestamptz` always; `date` only for true calendar-day values (birthdays, due dates)
- **Enum-ish values:** `text` + `check` constraint (easy to extend); Postgres `enum` only for values that will truly never change
- **IDs:** `uuid` everywhere, `gen_random_uuid()` default

## Multi-tenancy & RLS

Every domain table carries `space_id` and is protected by row-level security scoped to space membership:

```sql
alter table public.example_things enable row level security;

create policy "members read" on public.example_things
  for select using (
    space_id in (
      select space_id from public.space_members
      where user_id = auth.uid()
    )
  );
-- equivalent policies for insert/update/delete
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
- [ ] Standard base shape present (`id`, `space_id`, timestamps, trigger)
- [ ] Money is integer cents; time is `timestamptz`
- [ ] Naming follows conventions
- [ ] RLS enabled with membership-scoped policies for all verbs used
- [ ] Indexes exist for the queries the module actually runs (and nothing speculative)
- [ ] Migration is additive and singly-scoped
