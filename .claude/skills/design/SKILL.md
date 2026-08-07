---
name: design
description: Life OS interface design system and process. Use before designing, restyling, or restructuring ANY UI in this repo — a page, zone, card, table, header, or component. Trigger on "make this look better", "rework this area", "add a card", "this doesn't feel right", "more visual", or when the user shares reference screenshots. Do not write JSX for new UI structure until this skill's mockup-first process has run; building real code as a design proposal is the exact failure this skill exists to prevent.
---

# Life OS design

This file is the single source of truth for how interfaces look and read here.
`docs/conventions.md` covers the wider engineering bar (motion, tickets,
component architecture) and defers to this file on anything visual or textual.

## Why this exists

Design here failed in one repeatable way: building finished code as the
proposal. The user reacts to real pages, rejections arrive after the work is
done, and the page becomes a graveyard of directions ("that's awful, complete
different direction"). The fix is a system: agree structure on cheap mockups,
build once, verify. The taste log at the end records decisions actually made,
so a new session inherits them instead of relearning them by failing.

## 1. The process: mockup first, code once

1. **Frame the zone.** Write the questions this area answers, one per card. If
   two elements answer the same question, one goes. If an element answers no
   question, it goes.
2. **Inventory the data.** Check the entity types (`lib/*/queries.ts`) and,
   when possible, the live row. Never design around a number the product
   doesn't store; never leave a stored fact showing nowhere. Absent data gets
   a designed state: one prompt in one place, siblings return null.
3. **Propose 2 to 4 structures as cheap mockups, in chat**, using the
   session's inline visual surface. Label each and state its bet in one line
   ("bets that time matters more than money"). Real data, never lorem figures.
4. **The user picks or mixes.** "Option 2 with option 1's footer" is a
   complete answer. Only then write app code, and write one version.
5. **Verify in the running browser.** Both themes. If blocked (signed out),
   say so plainly; never claim visual verification that didn't happen.

Never ship multiple built variants to the page as a picker. That burns the
user's trust and the page's coherence at once.

Proportionality: a mechanical change ("make it full width") needs none of
this. See CLAUDE.md's "Answering a suggestion" for when to push back.

## 2. Card grammar

Every stat card, top to bottom:

1. **Label** — a short noun for the *subject*, never a period. "Payment
   split", not "This month"; "Balance", not "Your balance right now".
2. **Provenance** — where the number came from, not filler. "From your 2nd
   August statement", "At today's payment and rate". If a figure is
   projected, say so ("Projected since your 2nd August statement").
3. **The information** — one hero figure, or the card's one graphic.
4. **At most one supporting line**, and only where the graphic cannot speak.
   If its figures already appear on the card, delete it.
5. **Optionally a closing note**, separated by a hairline (`border-t pt-3`)
   at 12px muted, pushed to the base with `mt-auto pt-4`.

Rules that follow:

- The biggest text is never a non-statement. Lead with the real figure; the
  calm framing lives in the provenance line. A bare "—" is the no-value hero.
- **Pence fade**: `ApexStatFigure` renders everything from the last "." in
  muted ink so the pounds carry the comparison. Use it for every currency
  hero.
- **Deltas ride under their value**, signed, in the money colours: red for
  costs-more, emerald for costs-less. Amber is deadlines, never deltas. If
  the card's headline already states the delta, do not repeat it below.
- One lucide icon per card in a **38px pastel chip** (`size-9.5 rounded-xl`,
  glyph `size-5`). Chips are visible anchors, not specks.
- The corner action slot carries the card's own menu or quick action; a card
  states its own identity rather than borrowing a section label above it.
- `ApexStatCard`'s content is a flex column, so a trailing note can take
  `mt-auto` and settle at the base. Cards in a row then end on one line
  however tall they grow.

## 3. The visual dialect

The language is the user's reference dashboards: consumer-fintech warmth, not
BI restraint. Thin hairline marks read as lifeless here.

- **Breathing room**: 20px card padding (`--card-spacing: --spacing(5)`) and
  `rounded-2xl`, which is 14.4px in this theme since every radius derives
  from `--radius`, not Tailwind's stock scale. Grids are `gap-4`; note
  `ApexCardGrid` still ships `gap-3.5` and pages that use it inherit that,
  so the two want reconciling. Space is what makes the references calm.
- **Colour occupies area**: indicators are thick and rounded. Arcs at ~14px
  stroke, meters at `h-3.5` with visible gaps between fully-rounded segments.
  The pastel track is part of the design, not an absence.
- **The figure is the event**: ~26px, free-standing, never crowded by its
  indicator.
- **Pills carry discrete data**: dates, deltas, one-fact tags render as
  pastel pills (`ApexStatTag`). A sentence stays a hint line.
- **Prefer a metaphor the eye already knows.** A finish-line flag on a track
  is understood before it is read; a coloured bar must be interpreted. This
  audience includes people who struggle to hold several facts at once, so a
  graphic carrying its own meaning beats one needing a legend. Where a card
  compares "what happens" against "what was meant to happen", draw both on
  one track and let the gap be a length, not a subtraction the reader
  performs.
- **Vary the form across a row.** Three cards side by side should not be
  three weights of the same bar. An arc, a segment meter and a hairline ruler
  read as a considered set; three meters read as a template.

### Choosing a display

| Shape of the fact | Display |
|---|---|
| Parts of one whole | `SegmentMeter` (the default) |
| Progress toward a target | `DataProgress` |
| Independent quantities compared | one `DataProgress` each, all scaled to the largest |
| Proportion that *is* the card's point | `ArcGauge` (the feature display) |
| A span of time measured against a deadline | a hairline ruler with markers |
| Discrete tiers you move between | a staircase, one step per tier |

Parts that sum to a whole are `SegmentMeter`; quantities that do not sum are a
`DataProgress` each. Every bar of either family takes `MeterHead` above it, and
they all stand `h-3.5` tall. Do not hand-roll a label-above-a-bar: two cards
writing their own is how a row stops matching, and it is what a user notices
before they can name it.

**Never give a bar a grey track.** `DataProgress` mixes its track from the bar's
own colour at 15% for a reason: `bg-muted` sits *darker* than the card in dark
mode and lighter in light, so a grey track flips polarity between themes, and
the token already means three other things across these cards. A bar needing a
track needs `DataProgress`, not a new primitive.

**A drill-down beats a sliver.** When the slice a card is about is a few percent
of its bar, do not label around it: split the graphic into two bars and let the
second one be 100% of the first one's relevant part. On the Equity card that
took a stake from 4.1% of a track (a 12px dot) to 8.2% of one, without inflating
anything, and it matched how the reader already thinks about the subject.

`ArcGauge` holds its value and the word naming it *both inside the opening*,
caption directly under the figure: split them across the gauge's edge and
they stop reading as one unit. Size the arc so the figure clears the stroke
by ~25px at its widest rather than shrinking the type.

### Graphics explain themselves

- **No mystery pixels**: every coloured region a user could point at and ask
  "what is that?" answers on hover, and its container carries an aria-label.
- **Tooltips are labels, not lectures**: a few words ("52 months down",
  "£244.19 this month"). If a region needs a sentence, the design failed
  upstream.
- **Tooltips live on graphics only, never on text.** A meter segment can't
  explain itself; words already have. If text seems to need a tooltip,
  rewrite the text. If a fact exists only inside a tooltip on text, it wasn't
  earning its place.
- **Charts carry no floating annotation pills.** A key names every mark,
  under the plot; values that would be printed on the plot live in hovers on
  the marks instead. In-plot text is axis ticks and nothing else.
- **A chart's viewBox width is load-bearing.** With `w-full` the browser
  scales the whole coordinate space to the container, so a 560-wide box in a
  1000px card multiplies every length by 1.8 and renders "10px" type at 18px.
  Size the viewBox near the real rendered width, and put
  `vector-effect="non-scaling-stroke"` on every stroke so line weights hold
  at any width. Symptom to recognise: reducing the numbers changes nothing
  on screen.
- **Draw charts at card weight, not dashboard weight.** Inside a card of 13px
  text a chart wants ~1.5px lines, ~3.5px end dots and 11px axis type. Stock
  chart defaults are built for a full-page dashboard and read as a pasted
  image here.

## 4. Tint vocabulary

`components/apex/anchor-tints.ts` — a colour means the same thing everywhere.
`ANCHOR_TINTS` tints icon chips; `TAG_TINTS` tints pills.

The two maps do **not** carry the same keys, so check before reaching:

| Tint | Means | `ANCHOR_TINTS` | `TAG_TINTS` |
|---|---|---|---|
| emerald (`balance`) | money-good: balances, equity, savings, debt cleared | yes | yes |
| sky (`bill`) | a card *about* committed cost: bills, interest | yes | yes |
| amber (`due`) | deadlines and windows | yes | yes |
| indigo (`property`) | the asset: property, LTV, stakes | yes | yes |
| violet (`subscription`) | optional recurring spend, nowhere else | yes | no |
| `destructive` | money-bad and failure states | no | yes |
| `neutral` | a fact with no valence | no | yes |
| terracotta (`primary`) | the page's single headline answer, one per page | yes | no |

Within a **two-part split**, emerald and amber are the pair: emerald for the
part that helps you, amber for the part that costs you. That is a contrast
inside one graphic, not the semantic anchor of a card, so a card about
interest still wears the sky chip while its interest segment runs amber.

Never pick a hue ad hoc. A genuinely new semantic extends the vocabulary
file deliberately, in its own change.

## 5. Copy and dates

- **No em dash in interface copy.** Split the sentence, or use a colon or
  comma. A standalone "—" as a no-value placeholder is a symbol, not writing.
- **Never describe behaviour the product doesn't have.** No notifications, no
  "we'll tell you", no automatic anything unbuilt.
- **Never claim to know the user's specific terms** when only an industry
  norm is known. Hedge honestly ("most lenders").
- **No orphaned data.** Every number names its subject in words. "From April
  2027" fails (from what?); "After the deal ends" passes. "+£227.20" fails
  (than what?); "£227.20 a month more" passes. A countdown needs its event.
  If a value only makes sense through an unstated event, state the event.
- **Lead with the consequence, then the mechanism.** A card about a coming
  change opens with what it costs, and explains why underneath. Naming only
  the event ("your deal ends") leaves the reader to work out both what ended
  and what follows; jargon like "deal" names neither.
- **Name what money does**, don't partition it. "Only £244.19 reduces what
  you owe" beats "£568.21 of it is interest", which reads as broken English.
- **Say less.** If the graphic shows it, the sentence goes. Where the app
  cannot tell two causes apart, state the fact and let the reader diagnose
  rather than guessing out loud.
- **Separators are rendered, not typed.** A "·" between facts is `<MetaDot />`
  (`components/shared/meta-dot.tsx`), so it carries its own size and dimming
  and screen readers skip it. The character survives only where an element
  cannot go: page titles, aria-labels, select option labels, anything typed
  `string`. Card-number typography ("•••• ····", "·1234") is not a separator.
- **Dates are language, not codes.** Always ordinal ("2nd August", never
  "2 August"), months spelled out. Abbreviation is a concession to width,
  never a default: only table cells, tight badges and chart axes shorten the
  month, and they keep the ordinal. Format through `lib/apex/dates`, which
  also returns the no-value dash rather than throwing on a bad date.
- UK vocabulary: early repayment charge, standard variable rate, term.
  Sentence case everywhere. GBP via `formatPence`/`formatPenceShort` only.

## 6. Structure

- **Say each fact once per page.** If the hero states the rate, there is no
  rate card. The reference dashboards divide the subject between cards; they
  never restate it.
- **Pages cap at 1100px** (`ApexPage`) and nothing renders full-bleed. Inside
  that cap a continuous meter spans its card happily; what failed was a strip
  of discrete ticks stretched across an uncapped page, which read as dots.
- **Normal card surfaces.** No inverted or dark feature panels, rejected
  outright. Hierarchy comes from position, size and the one terracotta
  accent, never from swapping the surface.
- **Page headers earn their space.** A bare module-name title repeats the
  sidebar and dies. The band carries something no card owns (a freshness
  line, roll-up totals) or the page opens on its first card.
- **Both themes always**; hand-picked colours carry `dark:` variants.

### Density ladder

| Role | Size |
|---|---|
| Hero figure (`ApexStatValue`) | 26px semibold |
| A card's opening sentence | 16px medium |
| Paired figures (payment columns) | 25px semibold |
| The arc's value, inside its opening | 22px semibold |
| Card label | 14px medium |
| Body, hints, verdicts | 13px |
| Provenance, small labels, legends, pills | 12px |
| Axis ticks, arc captions, ruler ends | 11px |

`tabular-nums` on any figure that aligns with another; proportional
elsewhere.

## 7. Taste log

Real decisions, with the user's words where they instruct. Keep appending.

**Rejected**

- The inverted dark hero panel: "That's awful, and the complete different
  direction."
- The thin-marks BI dialect as a whole: well-formed dense cards read as wrong
  without the user being able to name why ("I don't really know what's wrong
  with it"). The diagnosis was chromatic starvation and tightness.
- Coloured pill filter toolbars: "generic … very 2000's style".
- Full-bleed components: a 1300px tick bar ("one long card just looks a bit
  funky") and a poster-sized chart ("like a PNG image just put there").
- Copy promising unbuilt behaviour: "it's just untrue."
- Em dashes: "We should NEVER USE the — to start with."
- Hard-written "·": "we should never hard write a dot."
- Orphaned fragments: "'from april 2027' like, from what? … a random +227 …
  7 months to what?"
- Meaningless titles ("Your rate"), titles naming a period ("This month"),
  and title bands restating the sidebar ("it just seems pointless").
- Big text that says nothing ("Nothing to do yet" as a hero).
- Verbose tooltips: "it's not CLEAR it's just too much text/content."
- Tooltips on everything: "a bit overkill" — graphics only.
- Partitive phrasing: "£568.21 of it is interest" — "sounds terrible".
- A mechanism line whose figures the card already shows: "doesn't the main
  card display that information kind of anyways?"
- Explaining at length what the reader can conclude: "I hate how much text
  there is."
- A detached legend row under a bar; a closing aside floating loose; a filled
  footer strip used for prose (it reads as an action bar).
- Amber on a money delta: "should be red." A floating arrow between figures:
  "looks so weird."
- Three variations of the same bar offered as three options: "they are really
  bland. Perhaps we need a different style of statistic?"
- A graphic whose shape contradicts its meaning. The pricing staircase rose
  toward the *worst* band, so the reader stood on the summit: "it's misleading
  given that we are on the highest step which feels like that's a good thing,
  but it's not." Height must track how good a rung is, and the ladder runs left
  to right as a climb, because that is the direction everything else is read in.
- Mismatched label pairs: "cheaper rates" opposite "higher rates". If one end
  says higher, the other says lower.
- Hedging a claim instead of removing it. "Cheaper rates at most lenders" under
  a graphic the app holds no rates for: "how do you know this? Is this true?"
  If the data cannot support the claim, the claim goes.
- A closing line opening on "That is": "it feels a bit too 'sentency' and less
  'data'. The 'That is' just isn't needed." Name the subject: "You currently
  own 8.2% of your share outright".
- A ladder of thresholds measured against today. Five of six rungs sat three to
  twelve years out and the sixth arrived unaided, so the card "feels arbitrary".
  Anchor a threshold to the moment it is actually used.

**Explaining a term**

An industry term is not explained by a title. "Pricing band" produced "I don't
really understand what band is, or what it means?" through three revisions
where every figure on the card was correct. What worked was naming the term
plainly (the card is now **Loan to value**, which is what a broker will say),
putting the consequence in the hero, and defining each rung in the units the
reader already holds: a rung says "loans up to £139,500" on hover, because
"85%" only ever asks "of what?". See [[audience-new-to-adult-life]] in memory.

**Accepted**

- The reference-dashboard grammar: provenance lines, verdicts, arc gauges,
  faded secondary digits, icon chips ("purposeful, clean, easy to read and
  even with ADHD").
- The ratified dialect: breathing room, 38px chips, pill tags ("the tag part
  is perfect"), meter-below as default with the arc as the feature display.
- Micro-interactions that explain, hence no mystery pixels.
- The card as its own header: name as title, facts as provenance, menu in the
  corner.
- A freshness line instead of a page title.
- A finish-line flag on a hairline ruler, explicitly for legibility under
  ADHD/OCD: a marked finish is understood before it is read.
- Spreading a card so the answer sits at the top and the note at the base.

## 8. Where the system lives

Every export below is `Apex`-prefixed where the file is an Apex primitive;
import the exact name, not the short form.

| File | Exports |
|---|---|
| `components/apex/stat-card.tsx` | `ApexStatCard`, `ApexStatValue`, `ApexStatUnit`, `ApexStatFigure`, `ApexStatTag`, `ApexStatHint` |
| `components/apex/anchor-tints.ts` | `ANCHOR_TINTS` (icon chips), `TAG_TINTS` (pills) |
| `components/apex/meter.tsx` | `MeterHead` (name left, amount right, above any bar), `SegmentMeter`, with per-segment tooltips |
| `components/apex/arc-gauge.tsx` | `ArcGauge`, the feature display |
| `components/apex/progress.tsx` | `DataProgress`, progress toward a target |
| `components/apex/page.tsx` | `ApexPage` (the 1100px cap), `ApexPageHeader`, `ApexSection`, `ApexCardGrid`, `ApexPlaceholder` |
| `components/apex/table-shell.tsx` | `TableCard`, `TableScroll`, `TableCardHeader`, `DataChip`, `TABLE_HEAD`, `TABLE_PINNED_HEAD`, `TABLE_FOOT`. Deliberately no toolbar: controls belong in the page header, the card holds rows and only rows. |
| `components/apex/due-state.tsx` | `dueState`, `DueStateBadge`, `todayKey` — the one due-language, and the server clock every card is passed |
| `components/apex/entity-avatar.tsx` | `EntityAvatar`, `AvatarBadge` |
| `components/apex/confirm-dialog.tsx` | The destructive-action gate: nothing fires straight from a menu item |
| `components/shared/meta-dot.tsx` | `MetaDot` separator |
| `lib/apex/dates.ts` | The date vocabulary, plus `parseDay` and `ordinal` |
| `lib/apex/money.ts` | `formatPence`, `formatPenceShort`, integer pence |

Mortgage cards import dates via `components/apex/mortgage/format.ts`, which
re-exports from `lib/apex/dates` and adds `pluralMonths` and `formatShare`.
That is the sanctioned path, not a bypass.

Read the primitive before designing with it. Compose `components/ui` via the
`render` prop (Base UI, not Radix), and never hand-patch `components/ui/**`.
