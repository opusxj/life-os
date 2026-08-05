---
name: design
description: Life OS interface design system and process. Use before designing, restyling, or restructuring ANY UI in this repo — a page, zone, card, table, header, or component. Trigger on "make this look better", "rework this area", "add a card", "this doesn't feel right", "more visual", or when the user shares reference screenshots. Do not write JSX for new UI structure until this skill's mockup-first process has run; building real code as a design proposal is the exact failure this skill exists to prevent.
---

# Life OS design

## Why this exists

Design here has failed in one repeatable way: building finished code as the
proposal. The user reacts to real pages, rejections arrive after the work is
done, and the page becomes a graveyard of directions ("that's awful, complete
different direction"). The fix is a system: agree structure on cheap mockups,
build once, verify. This file also carries the taste log — decisions the user
has actually made — so new sessions don't relearn them by failing.

## The process: mockup first, code once

1. **Frame the zone.** Write down the questions this area answers, one
   question per card or element. If two elements answer the same question,
   one of them goes. If an element answers no question, it goes.
2. **Inventory the data.** Check the entity types (`lib/*/queries.ts`) and,
   when possible, the live row. Never design around a number the product
   doesn't store; never show a stored fact nowhere at all. Absent data gets a
   designed state: one prompt in one place, siblings return null.
3. **Propose 2 to 4 structures as cheap mockups, in chat.** Use the session's
   inline visual surface (the visualize widget, or a throwaway HTML file
   rendered in the Browser pane); ASCII only as a last resort. Label each
   option and state its bet in one line ("bets that time matters more than
   money"). Real data in the mockups, never lorem figures.
4. **The user picks or mixes.** "Option 2 with option 1's footer" is a
   complete answer. Only after a pick do you write app code, and you write
   one version.
5. **Verify in the running browser before calling it done.** Both themes.
   If signed out and blocked, say so plainly; never claim visual verification
   that didn't happen.

Never ship multiple built variants to the page as a picker. That burns the
user's trust and the page's coherence at the same time.

## Card grammar

Anatomy, top to bottom, every stat card:

1. **Label** — short noun for the question ("Balance", "Pricing band").
2. **Provenance description** — where the number comes from, not filler:
   "From your 2 Aug statement", "At today's payment and rate". If a figure is
   projected, the description says so.
3. **The information** — one hero figure with its unit faded
   (`ApexStatUnit`), or the card's one visual.
4. **At most one verdict line** — a conclusion, stated plainly: "£2,850 of
   balance away from the 90% band." Never a vibe, never an invitation.

Rules that follow from it:

- The biggest text is never a non-statement. Lead with the real figure; calm
  framing lives in the description. A bare "—" is the no-value hero.
- Faded secondary digits: pence in muted ink so pounds carry the comparison.
- One lucide icon per card in a tinted chip; the tint comes from the
  vocabulary below.
- Arcs (`ArcGauge`) for proportion-of-a-known-whole only. Thin `h-1.5`
  segmented bars (gap-px) for parts-of-one-whole. Tick meters for elapsed
  time. Never a saturated block.
- Corner action slot for the card's own menu or quick action; a card carries
  its own identity rather than borrowing a section label above it.

## Tint vocabulary (semantic, never decorative)

Defined in `components/apex/anchor-tints.ts`; a color means the same thing on
every page:

- **emerald** money-good: balances, equity, wins, savings
- **sky** committed costs: bills, interest
- **amber** deadlines and windows
- **indigo** the asset: property, LTV, stakes
- **violet** optional recurring spend (subscriptions) — nowhere else
- **terracotta (primary)** the page's single headline answer — one per page

Never pick a hue ad hoc. If a new semantic is genuinely needed, extend the
vocabulary file deliberately, in its own change.

## Copy rules (hard, user-mandated)

- Never an em dash in interface copy. Split the sentence, or use a colon or
  comma. A standalone "—" as a no-value placeholder is a symbol, not writing.
- Never describe behaviour the product doesn't have. No "we'll tell you", no
  notifications, no automatic anything that isn't built.
- Never claim to know the user's specific deal or account terms when only an
  industry norm is known; hedge honestly ("most lenders").
- UK vocabulary: early repayment charge, standard variable rate, deal, term.
  Sentence case everywhere. GBP via `formatPence`/`formatPenceShort` only.

## Structure rules

- **Say each fact once per page.** If the hero states the rate, no rate card.
  The reference dashboards divide the subject between cards; they never
  restate it.
- **Normal card surfaces.** No inverted/dark feature panels — rejected
  outright. Hierarchy comes from position, size, and the one terracotta
  accent, not from surface swaps.
- Density ladder: 13px body, 12px labels, 11px provenance; `size="sm"` cards;
  `gap-3.5` grids; `tabular-nums` on aligned figures.
- Both themes always; hand-picked colors carry `dark:` variants.
- Page headers earn their space: a bare module-name title repeats the sidebar
  and dies. The band carries something no card owns (a freshness line, roll-up
  totals) or the page opens on its first card.

## Taste log (real decisions, keep appending)

Rejected, with the user's words where they're instructive:

- The inverted dark hero panel: "That's awful, and the complete different
  direction."
- Coloured pill filter toolbars: "generic … very 2000's style".
- Copy promising unbuilt behaviour ("we'll tell you then"): "We should never
  have text like this, it's just untrue."
- Em dashes in copy: "We should NEVER USE the — to start with."
- Meaningless card titles ("Your rate"): "doesn't really mean anything to me,
  it's just a title?"
- A title band restating the sidebar ("Mortgage" + Add mortgage): "it just
  seems pointless."
- Big text that says nothing ("Nothing to do yet" as a hero).

Accepted:

- The reference-dashboard grammar: provenance subtitles, verdict lines, arc
  gauges, grey secondary digits, icon chips ("purposeful, clean, easy to
  read and even with ADHD").
- The divided footer strip: small muted label over bold value, hairline
  dividers.
- The card as its own header: name as title, facts as description, menu in
  the corner.
- A freshness line instead of a page title.
- Cards should have "a title, small description and then the relevant
  information".

## Where the system lives in code

- `components/apex/stat-card.tsx` — ApexStatCard, ApexStatValue,
  ApexStatUnit, ApexStatHint
- `components/apex/anchor-tints.ts` — the tint vocabulary
- `components/apex/arc-gauge.tsx` — proportion arcs
- `components/apex/table-shell.tsx` — table card, toolbar, chips
- `components/apex/page.tsx` — page, header, section primitives
- `docs/conventions.md` — the wider bar: motion, tickets, definition of done

Read the relevant primitive before designing with it; compose `components/ui`
via the `render` prop (Base UI, not Radix).
