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
- One lucide icon per card in a **38px pastel chip** (`rounded-xl`, tint at
  ~10 to 15% opacity, glyph in the tint's strong step). Chips are visible
  anchors, not 20px specks.
- Corner action slot for the card's own menu or quick action; a card carries
  its own identity rather than borrowing a section label above it.

## The dialect (ratified on mockups, 2026-08-06)

The visual language is the user's reference dashboards: consumer-fintech
warmth, not BI restraint. Thin hairline marks read as lifeless here.

- **Breathing room**: ~20px card padding, 16px radius (`rounded-2xl`),
  `gap-4` grids. Space is what makes the references calm.
- **Color occupies area**: indicators are thick and rounded. Arcs at ~13px
  stroke. Meters at `h-3.5`, fully-rounded segments with visible gaps.
  Tick meters ~16px tall. The pastel track is part of the design, not an
  absence.
- **The figure is the event**: ~26px, free-standing, never crowded by its
  indicator. The number does not sit tight against an arc or bar.
- **Pills carry discrete data**: dates, deltas, and one-fact tags render as
  pastel pills (`ApexStatTag`), tinted from the vocabulary. "£2,850 to the
  90% band" is a pill; a sentence stays a hint line.
- **Prefer a metaphor the eye already knows.** A finish-line flag on a track
  is understood before it is read; a coloured bar has to be interpreted
  first. This audience includes people who struggle to hold several facts at
  once, so a graphic that carries its own meaning beats one that needs a
  legend. Where a card compares "what happens" against "what was meant to
  happen", draw both on one track and let the gap be a length rather than a
  subtraction the reader performs.
- **Displays**: meter-below is the default proportional display. The large
  arc is the feature display, reserved for cards whose whole point is the
  proportion. Its value and the word naming that value both sit inside the
  opening, the caption directly under the figure: split them across the
  gauge's edge and they stop reading as one unit. Size the arc so the figure
  clears the stroke by ~25px at its widest rather than shrinking the type.
- **No mystery pixels**: every colored region a user could point at and ask
  "what is that?" explains itself on hover via the house tooltip (and its
  container carries a sensible aria-label). Tooltips are labels, not
  lectures: a few words ("52 months down", "£244.19 clears debt"). If a
  region needs a sentence to explain, the design failed upstream.
- **Tooltips live on graphics only, never on text.** A meter segment, an
  arc, a track: those can't explain themselves, so they hover. Words
  already have. If a piece of text seems to need a tooltip, rewrite the
  text; if a fact only exists inside a tooltip on text, the fact wasn't
  earning its place ("tooltips on everything is a bit overkill").
- **No orphaned data**: every number on a card names its subject in words.
  "From April 2027" fails (from what?); "After the deal ends" passes.
  "+£227.20" fails (than what?); "£227.20 a month more" passes. A countdown
  needs its event ("Your deal ends in 7 months", never a bare "7 months"
  badge). If a value only makes sense through an unstated event, state the
  event as a sentence and hang the numbers off it.
- **Deltas ride under their value**, signed, in the money colors: red for
  costs-more, emerald for costs-less (amber is deadlines, never deltas).
  The reference grammar's "↑ 2.1% vs last week" line, not a floating chip.
  When the card's headline already states the delta, do not repeat it below.
- **Separators are rendered, not typed.** A "·" between facts on one line is
  `<MetaDot />` (`components/shared/meta-dot.tsx`), never the character: it
  then carries its own size and dimming instead of inheriting a glyph that
  reads as a full stop at 12px, and screen readers skip it. The character
  survives only where an element cannot go: page titles, aria-labels, select
  option labels, and anything typed `string`. Card-number typography
  ("•••• ····", "·1234") is not a separator and stays.
- **Lead with the consequence, then the mechanism.** A card about a coming
  change opens with what it costs ("In 7 months your payment rises £227.20 a
  month"), and explains why in one sentence underneath. Naming only the event
  ("your deal ends") leaves the reader to work out both what ended and what
  happens next; jargon like "deal" names neither.
- **Page width caps at 1100px**, and that cap is what makes width safe:
  inside it, a continuous meter spans its card happily. What failed was a
  strip of discrete ticks stretched across a full-bleed page, which read as
  dots. Charts still live beside a legend rail rather than running edge to
  edge.
- **Charts carry no floating annotation pills**: a legend rail beside the
  plot names every mark (swatch, label, value). In-plot text is axis ticks
  and nothing else.

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
- **Dates are language, not codes.** Always ordinal ("2nd August", never
  "2 August"), and months spelled out. Abbreviation is a concession to
  width, never a default: only table cells, tight badges and chart axes
  shorten the month, and they keep the ordinal. Format through
  `lib/apex/dates` so this cannot drift again; it also returns the no-value
  dash rather than throwing on an unparseable date.

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

- The thin-marks BI dialect as a whole: a page of well-formed dense cards
  read as wrong without the user being able to name why ("I don't really
  know what's wrong with it"). The diagnosis was chromatic starvation and
  tightness, fixed by the ratified dialect above.
- Orphaned data fragments: "'from april 2027' like, from what? … There's a
  random +227 I don't know what it means? … 7 months in the top right
  corner, 7 months to what?" Fixed by stating the event as a sentence.
- Full-bleed components: a 1300px tick bar ("the giant lined bar … one long
  card just looks a bit funky") and a poster-sized chart ("This is also
  just huge … like a PNG image just put there"). Fixed by the width cap and
  the chart's legend rail.
- Verbose tooltips: "it's not CLEAR it's just too much text/content."
- "Your deal ends in 7 months": "I don't think this is super clear." The
  fix was to lead with the consequence and name the rate, not the "deal".
- Hard-written "·" separators: "we should never hard write a dot, it should
  use the icon library."
- "£568.21 of it is interest": "sounds terrible". Partitive phrasing reads
  as broken English; name what the money does instead ("Only £244.19
  reduces what you owe").
- A detached legend row stacked under a bar: the swatches are good, the
  row is not. Put each key at its own end of the bar so the swatch points
  at the run it names, and let the segment tooltips carry the amounts.
- A mechanism line whose figures the card already shows: "doesn't the main
  card display that information kind of anyways?" A supporting sentence
  earns its place only where the graphic cannot speak, which usually means
  the broken states, not the healthy one.
- Card labels that name a period instead of a subject ("This month"):
  "doesn't really describe what this card actually is". Labels are short
  nouns for the thing ("Payment split"); the period belongs in the
  provenance line.
- A closing aside left loose under the content: "it's just floating there
  randomly". It needs separation, but only a hairline: `border-t pt-3` at
  12px muted, inside the card body. A filled strip is heavier chrome than
  the lightest line on the card deserves, and `ApexStatCard`'s footer slot
  reads as an action bar (the Balance card puts a button there), so prose
  in it miscues as a toolbar.
- A card whose parts bunch at the top with dead space beneath: spread it,
  answer at the top and closing note at the base. `ApexStatCard`'s content
  is a flex column for exactly this, so a trailing note takes `mt-auto`
  (with `pt-4` for a floor when there is no slack) and cards in a row end
  on the same line however tall they grow.
- Amber on a money delta: "The 227 should not be orange, it should be red."
  Amber means deadline; costs wear red, savings emerald.
- A floating arrow between figures: "a weird arrow which looks so weird."
  Labelled columns replaced it.

Accepted:

- The reference-dashboard grammar: provenance subtitles, verdict lines, arc
  gauges, grey secondary digits, icon chips ("purposeful, clean, easy to
  read and even with ADHD").
- The ratified dialect, chosen on mockups: breathing room, 38px chips, pill
  tags ("the tag part is perfect", "the data chip is really nice and
  actually adds to it"), meter-below as the default display with the big
  arc kept as the feature display.
- Micro-interactions that explain: "hovering over the green square and
  orange square … we aren't really indicating or showing what they even
  are" — hence the no-mystery-pixels rule.
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
