# Foundations Spec — Accounts, Spaces, Membership

Decided with John 2026-08-02. This is the contract for E1 Foundations; schema and auth tickets implement exactly this.

## Accounts & auth (MVP scope — LIFE-17)

- Sign-up and sign-in with **email + password**, plus **magic link** sign-in.
- Sign-up requires **email confirmation code** (OTP) before the account is active.
- **Forgot/reset password** flow included.
- Session persists across refresh; unauthenticated users are routed to sign-in; the shell renders only for signed-in users.
- Profile stores the basics only: display name, avatar. Everything else waits for a real need (80% rule).

## Personal spaces (invariants)

- Every user gets a **personal space automatically at sign-up** (DB trigger — cannot be skipped by any client).
- A user always has ≥1 space; they **cannot leave** and **cannot delete** their personal space.
- Personal spaces are otherwise normal spaces — same tables, same RLS.

## Space creation & limits

- Anyone can create spaces. Cap: a user may **own at most 2 shared spaces** (personal space excluded → max 3 owned). Enforced in the DB; single constant to raise if it ever chafes. Membership in *other people's* spaces is uncapped.
- Roles per space: **owner / admin / member / guest** (guest ≈ read-only). Simple names in the schema; family-flavored display labels can be a UI decision later.
- Future (phase 2, schema leaves room, no speculative columns now): modules toggled on/off per space and per member; per-member data visibility toggles.

## Invites & joining (LIFE-23)

- Join via **email invite** (works for people without accounts yet) or **in-app invite** to an existing user — the latter raises an in-app **notification**.
- Invites carry the target role, expire after 14 days, and are accepted atomically in the DB (membership + invite status in one step).
- Owners/admins can invite and remove members; members can leave any space except their own personal space; owners cannot be removed.

## Data lives in spaces

- Every domain row belongs to a space (`space_id`). **Deleting a space deletes all its data** (FK cascade) — but user-facing deletion is always **soft delete** first (`deleted_at`/`deleted_by`); hard deletes are a system-level operation.
- We track **who created** (`created_by`) and **who deleted** (`deleted_by`) every domain row.
- Anyone in a space can create data (guests read-only).
- Notifications and profiles are the two deliberate exceptions: they are user-scoped infrastructure, not space data.

## Decisions log

| Decision | Choice | Rationale |
|---|---|---|
| Shared-space cap | 2 owned (+personal) | John delegated; generous for a family, one constant to change |
| Role names | owner/admin/member/guest | Simple + conventional; family labels are UI copy, not schema |
| Soft delete | Standard on all domain tables | John: track deletions, avoid hard deletes |
| Auth methods | Email+password AND magic link | John: both, MVP-complete with OTP confirm + reset |
