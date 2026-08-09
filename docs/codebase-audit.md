# Codebase audit

Run 2026-08-09 by five parallel review agents (component duplication, lib hygiene, docs staleness, structure and agent navigability, design-rule adherence), after the mortgage page was ratified as the app-wide design reference. Findings verified against the working tree of that day; this file is the work list that came out of it.

Severities: **fix-now** = cheap and unambiguous, batch into cleanup commits · **ticket** = deserves its own focused session on the board · **note** = worth knowing, no action owed. Strike items through (or delete them) as they land, and delete this file when it is empty.

## Summary of open findings

**fix-now (24)**

- Mortgage footer-note markup hand-rolled in 8 cards (one already extracted it locally)
- Form error alert paragraph copy-pasted 13 times with the identical className
- AccountCard and GoalCard duplicate the runtime-hex tinted chip and the whole hand-rolled header, with a comment admitting it
- Pence-fade implemented three ways: ApexStatFigure, BalanceFigure, and an inline copy in PaymentColumn
- duePill in the subscriptions page re-derives dueState's labels with divergent wording
- ApexCardGrid ships gap-3.5 against the design bar's stated gap-4
- The house spring literal is redeclared in six components
- Local-today key logic duplicated between due-state.tsx and transaction-dialog.tsx
- topUpGoal's linked-goal branch skips revalidateApex()
- Four budget/goal mutations lack the count:"exact" silent-no-op guard
- Mortgage actions revalidate only /apex/mortgage, leaving the Overview stale
- friendlyDbError is copy-pasted into six actions files
- parseDay exists in lib/apex/dates.ts and as a private copy in mortgage/status.ts
- Dead exports in amortization.ts: balanceSeriesWithReversion AND simulatePayoff
- lib/supabase/client.ts (createBrowserSupabase) is dead code
- currentMonth() uses UTC while every other Apex date helper uses server-local time
- Overview card titled "This month", an explicitly rejected title pattern
- Budgets Headroom bar has a pace tick with no hover label (mystery pixel)
- Currency heroes skip the ApexStatFigure pence fade in six places
- Account and bank cards animate without reduced-motion handling
- Goal card formats its target date with date-fns instead of lib/apex/dates
- Mark-paid error message lives only in a native title tooltip on a text button
- Amber instruction chip in the transactions footer misuses both the pill and the deadline colour
- DueStateBadge hand-writes an amber tint that drifts from TAG_TINTS.due

**ticket (17)**

- Add/edit container idiom is three-way split (Sheet vs Dialog vs Drawer) and two files named drawer are Sheets
- Hidden-input controlled Select hand-rolled in 7+ places; transaction-dialog already has the generic solution as a private component
- Field wrapper (space-y-1.5 + 13px Label) hand-rolled ~45 times while components/ui/field.tsx sits entirely unused
- MoneyInput is shared from an awkward home while ten other money fields hand-roll a different money grammar
- useActionState close-and-refresh glue duplicated in ~12 forms
- Breakdown legend row exists only in monthly-cost-card but is codified house grammar the next card will hand-roll
- Query modules disagree on error handling: one throws, six swallow into empty/zero UI
- todayKey lives in components/apex/due-state.tsx, and the local-date-key function exists in four copies
- Client-clock violations: bank-card expiryState and goal-card paceHint/monthsToTarget
- lib/spaces mutations have the same silent-no-op gap the Apex actions fixed
- Soft-delete stamping is implemented five times
- data-standards.md is missing two standards the migrations now rely on: composite (id, space_id) child FKs and the update-guard trigger
- todayKey (the server clock) lives in a component file, imported by every Apex page
- Three surfaces hand-roll label-above-a-bar furniture instead of MeterHead
- Two different money-out hues: rose in transactions/cashflow, red/destructive everywhere else
- Transfer's sky colour is a raw hex repeated in three places, and "sky = transfer" is not in the vocabulary
- Card grid gap unreconciled: skill says gap-4, ApexCardGrid and two hand-written grids ship gap-3.5

**note (26)**

- Runtime color-mix tint recipes drift across four chip components
- Empty-state border drift: budgets borders its Empty, every other surface renders it bare
- Do not extract the ApexStatValue + ApexStatFigure + ApexStatUnit hero triple
- Identity-dot rows (colored dot + name + amount) recur but vary too much to extract yet
- recurring-drawer states its cadence options twice in one file
- Track end-label rows repeat between FinishTrack and DealMeter
- The 'due soon' 7-day horizon rule is computed independently in overview and sidebar
- Seven identical FormState type aliases
- Duplicated yyyy-mm-dd validators across actions files
- requireContext/getWorkspace is a heavy way to resolve spaceId+userId in actions
- goal-card formats dates with date-fns instead of the house dates vocabulary
- Three query modules export colliding option-type names with different shapes
- board.md's frozen-archive banner is accurate — no change needed
- foundations.md verified accurate against the foundations migrations
- conventions.md file references and mistake-log claims verified current
- View-vocabulary .ts files under components/ are correct but the pattern is undocumented
- docs/README's module-spec rule does not cover nested area specs
- CLAUDE.md hard rules verified against reality: all hold
- Neutral segment colour (slate-500) is defined locally, not in the vocabulary file
- Stale doc comments claim due dates render without ordinals ("Mon 3 Aug")
- Bank card parses dates with raw new Date instead of parseDay
- Cashflow legend hand-rolls its swatch instead of using MeterSwatch
- Sidebar footer's "+£x this month" is a borderline orphaned delta
- Budgets Headroom card has no provenance line
- Goal card states the passed-target fact twice
- Clean sweeps worth recording: em dashes, hard-written dots, unbuilt-behaviour claims

## Resolved 2026-08-09 (same session as the audit)

All documentation-staleness findings were fixed the day the audit ran:

- ~~apex.md decision 9 still claims lazy per-visit category seeding; it moved to a spaces trigger~~
- ~~apex.md header still says "draft for John's sign-off" though sign-off happened 2026-08-02 and E2 shipped~~
- ~~apex.md build plan has no statuses and still lists Mortgage as "*NEW*" though it is LIFE-29 and Done~~
- ~~apex.md Mortgage page section lists six planned cards; the built page renders eleven~~
- ~~apex.md schema draft shows plain single-column FKs; every applied migration uses composite (id, space_id) FKs~~
- ~~apex.md says the Apex sidebar nav "lands with the first Apex UI ticket"; it landed long ago~~
- ~~mortgage.md header claims "Nothing here is built yet" — F1, F6, F8's split and the allowance gating are live~~
- ~~mortgage.md F7 (data model corrections) reads as untouched; half its fields shipped in migration 20260805090000~~
- ~~mortgage.md references rate-card.tsx, which no longer exists~~
- ~~mortgage.md §4.3 item 4 says property_value is "rendered by nothing" and should be deleted; it now feeds two cards~~
- ~~mortgage.md contains two full copies of F8 and F9~~
- ~~Four docs still say the board is a "mirror of Linear once connected"; Linear has been canonical since 2026-08-02~~
- ~~project-overview.md module map still lists Apex as "First module to build"~~
- ~~Design skill's 'Where the system lives' table is stale on three points~~
- ~~Three docs still say board.md is the live board; board.md says it is a frozen archive~~


## Fix now

### Mortgage footer-note markup hand-rolled in 8 cards (one already extracted it locally)

Files: `components/apex/mortgage/payoff-card.tsx` · `components/apex/mortgage/this-month-card.tsx` · `components/apex/mortgage/rent-card.tsx` · `components/apex/mortgage/what-if-card.tsx` · `components/apex/mortgage/ltv-card.tsx` · `components/apex/mortgage/equity-card.tsx` · `components/apex/mortgage/cost-ahead-card.tsx` · `components/apex/mortgage/monthly-cost-card.tsx` · `components/apex/stat-card.tsx`

The base-pinned closing note — `<div className="mt-auto pt-4"><p className="border-t pt-3 text-[12px] leading-snug text-muted-foreground">` — is hand-rolled in 8 mortgage cards (payoff-card.tsx:128-137 even wraps it in a private FooterNote component, which is an admission the pattern deserves a name). ltv-card.tsx:253-273 and equity-card.tsx:136-145 add a conditional `font-medium text-destructive`; cost-ahead-card.tsx:291-308 embeds colored spans; monthly-cost-card.tsx:104-114 pins a legend total row instead of prose on the same shell. Eight copies of load-bearing comment-and-class furniture is exactly how the next card drifts.

**Do:** Add `ApexCardFootnote` to components/apex/stat-card.tsx: renders null on empty children, outputs the `mt-auto pt-4` wrapper plus the `border-t pt-3 text-[12px] leading-snug text-muted-foreground` paragraph, accepts `className` (for the destructive variant) and ReactNode children (for cost-ahead's spans and monthly-cost's total row — give it an `asRow` escape or let monthly-cost keep only the wrapper). Replace all 8 hand-rolls, delete payoff-card's local FooterNote, and add the export to the design skill's section-8 table.

### Form error alert paragraph copy-pasted 13 times with the identical className

Files: `components/apex/accounts/account-form-sheet.tsx` · `components/apex/accounts/card-form-sheet.tsx` · `components/apex/accounts/transfer-sheet.tsx` · `components/apex/subscriptions/recurring-drawer.tsx` · `components/apex/mortgage/mortgage-drawer.tsx` · `components/apex/transactions/transaction-dialog.tsx` · `components/apex/budgets/new-budget-dialog.tsx` · `components/apex/budgets/budget-row.tsx` · `components/apex/budgets/goal-card.tsx` · `components/apex/budgets/goal-drawer.tsx` · `components/spaces/create-space-dialog.tsx` · `components/spaces/manage-space-dialog.tsx`

`<p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-[13px] text-destructive">{state.error}</p>` appears verbatim in 13 places (grep `bg-destructive/10 px-3 py-2`). The two balance popovers (sync-balance-popover.tsx:69, update-balance-popover.tsx:100) use a bare unboxed variant of the same idea, so the error grammar has already forked once.

**Do:** Extract `<FormError>{state?.error}</FormError>` (renders null for falsy children, owns role="alert" and the boxed classes; optional `plain` prop for the popover variant) into a shared file — components/shared/form-error.tsx since spaces/ uses it too — and replace all 13 boxed call sites plus the 2 popover variants.

### AccountCard and GoalCard duplicate the runtime-hex tinted chip and the whole hand-rolled header, with a comment admitting it

Files: `components/apex/accounts/account-card.tsx` · `components/apex/budgets/goal-card.tsx` · `components/apex/stat-card.tsx`

account-card.tsx:69-99 and goal-card.tsx:108-132 carry byte-identical chip recipes (`color-mix(in srgb, <hex> 14%, transparent)` bg, 75%-toward-black icon, dark 20%/raw-hex) and the same stacked name + 12px facts-line markup, both hand-rolling ApexStatCard's header because its icon slot is className-only. goal-card.tsx:102-107 says outright: "Chip treatment mirrors account-card.tsx ... the two chips should someday share a component." Two call sites plus an admitted-drift comment meets the extraction bar.

**Do:** Add `ApexStatChip({ color, children })` to stat-card.tsx carrying the size-9.5 rounded-xl geometry and the four CSS custom properties, and use it in both cards. Better still, teach ApexStatCard an `iconColor?: string` that renders this chip so both cards can drop their hand-rolled headers entirely (AccountCard keeps its outer motion.div; ApexStatCard already accepts className/action). Either way the mix percentages live in exactly one place.

### Pence-fade implemented three ways: ApexStatFigure, BalanceFigure, and an inline copy in PaymentColumn

Files: `components/apex/stat-card.tsx` · `components/apex/accounts/account-card.tsx` · `components/apex/mortgage/headline-card.tsx`

ApexStatFigure (stat-card.tsx:127-143) is the canonical lastIndexOf(".") fade. account-card.tsx:170-188 BalanceFigure re-implements it to add a negative variant (`opacity-60` so pence stay red instead of going grey). headline-card.tsx:153-165 PaymentColumn inlines the fade a third time — and uses `text-[25px]` where ApexStatValue is `text-[26px]`, a one-pixel hero drift that smells accidental. ApexStatFigure sets no font size (it inherits), so PaymentColumn can adopt it with zero visual change.

**Do:** Add `negative?: boolean` to ApexStatFigure (fade via opacity-60 when set, text-muted-foreground/60 otherwise). Delete BalanceFigure and render `<ApexStatFigure negative={negative}>{formatPenceShort(account.balance)}</ApexStatFigure>`. Replace PaymentColumn's inline slice with ApexStatFigure, and while there decide the 25px: either switch to ApexStatValue's 26px or leave a comment saying the smaller step is deliberate for the two-column layout.

### duePill in the subscriptions page re-derives dueState's labels with divergent wording

Files: `app/(shell)/apex/subscriptions/page.tsx` · `components/apex/due-state.tsx`

due-state.tsx is chartered as "the one due-language for every surface", yet page.tsx:203-214 duePill() rebuilds the same branch ladder (overdue/today/tomorrow/≤7 days) to produce labels dueState already computed in `state.label`, then adds one genuine difference: beyond a week it prefixes "Due " to the short date ("Due Mon 3 Aug" vs the badge's bare "Mon 3 Aug"). Any future change to the window or wording now has to be made twice or the pill and table disagree.

**Do:** Move the pill mapping into due-state.tsx next to DueStateBadge — e.g. `duePill(state): { label, tint }` that reuses `state.label` (prefixing "Due " only for the beyond-a-week date form) and maps status → TagTint. The page imports it; the file that owns the due-language owns both renderings of it.

### ApexCardGrid ships gap-3.5 against the design bar's stated gap-4

Files: `components/apex/page.tsx` · `.claude/skills/design/SKILL.md`

page.tsx:109 has `grid gap-3.5 ...`. The design skill (SKILL.md:84-86) states "Grids are gap-4; note ApexCardGrid still ships gap-3.5 ... so the two want reconciling." Meanwhile mortgage-stack.tsx's three local grids already use gap-4, so the two grid families on adjacent pages currently disagree by 2px.

**Do:** Change ApexCardGrid to `gap-4`, eyeball the overview/subscriptions/accounts pages in the browser, and delete the reconciliation caveat from the design skill.

### The house spring literal is redeclared in six components

Files: `components/shell/rail.tsx` · `components/apex/accounts/account-card.tsx` · `components/apex/accounts/bank-card.tsx` · `components/apex/transactions/transaction-dialog.tsx` · `components/apex/mortgage/finish-track.tsx` · `components/apex/mortgage/what-if-card.tsx`

`{ type: "spring", stiffness: 500, damping: 32 }` is declared as a local const in five files, and what-if-card.tsx:36 declares a sixth copy without `type` (fine for useSpring, but a second shape of the same constant). docs/conventions.md:25 names it "the house spring" — a named documented constant that has no named export.

**Do:** Create lib/motion.ts exporting `HOUSE_SPRING` (and a `HOUSE_SPRING_PHYSICS` without `type` for useSpring, or just let useSpring take the same object). Replace the six locals. A future tuning of the spring then lands everywhere at once, which is the entire point of calling it the house spring.

### Local-today key logic duplicated between due-state.tsx and transaction-dialog.tsx

Files: `components/apex/due-state.tsx` · `components/apex/transactions/transaction-dialog.tsx` · `lib/apex/dates.ts`

due-state.tsx:70-74 `todayKey()` and transaction-dialog.tsx:553-563 `localToday()`/`localDaysAgo()` both hand-format the local date to yyyy-mm-dd with the same padStart dance. lib/apex/dates.ts is the chartered date vocabulary and has parseDay but no key-producing counterpart, which is why both files rolled their own.

**Do:** Move key production into lib/apex/dates.ts (`todayKey()`, `dayKeyAgo(days)`), have due-state.tsx re-export todayKey for its existing importers (panel.tsx, pages), and delete transaction-dialog's two locals.

### topUpGoal's linked-goal branch skips revalidateApex()

Files: `lib/apex/budgets/actions.ts`

CONFIRMED. In topUpGoal, the linked-account branch inserts the transfer transaction and returns { success: true } at line 219 without calling revalidateApex(); the unlinked branch (line 229) and every other mutating action in the file do call it. The TopUpDrawer's router.refresh() only refreshes the current route, so after a linked top-up the Router Cache serves stale numbers on sibling Apex pages (overview tiles, sidebar net, accounts) — exactly the staleness lib/apex/revalidate.ts documents.

**Do:** Add revalidateApex() immediately before the `return { success: true }` at line 219 of lib/apex/budgets/actions.ts (after the transfer insert error check).

### Four budget/goal mutations lack the count:"exact" silent-no-op guard

Files: `lib/apex/budgets/actions.ts`

CONFIRMED. updateBudgetAmount (lines 71-76), removeBudget (88-96), updateSavingGoal (135-140), and deleteSavingGoal (151-159) run .update() with no { count: "exact" } and no count===0 check. PostgREST raises no error when RLS or the deleted_at filter removes the row, so a save that wrote nothing reports success — the exact failure the same repo already fixed in saveAccount, softDelete (accounts), updateTransaction, softDeleteTransaction, saveRecurringPayment, cancelRecurringPayment, updateMortgage, updateMortgageBalance, deleteMortgage, and even topUpGoal's unlinked branch in this same file.

**Do:** Mirror the sibling pattern in all four: pass { count: "exact" } as the second argument to .update(), destructure { error, count }, and return an error when count === 0 (e.g. "That budget no longer exists." / "That goal was removed, nothing saved.").

### Mortgage actions revalidate only /apex/mortgage, leaving the Overview stale

Files: `lib/apex/mortgage/actions.ts` · `lib/apex/revalidate.ts`

CONFIRMED (new, same class as the topUpGoal bug). createMortgage (line 35), updateMortgage (80), updateMortgageBalance (117), and deleteMortgage (141) call revalidatePath("/apex/mortgage") directly instead of revalidateApex(). But getOverviewData (lib/apex/overview/queries.ts line 64) includes getMortgages, so the Apex overview renders mortgage data too — after updating a mortgage balance, navigating to /apex shows the pre-mutation figure until hard reload. revalidate.ts exists precisely because "every Apex surface reads the same ledger".

**Do:** Replace all four revalidatePath("/apex/mortgage") calls with revalidateApex() (import from @/lib/apex/revalidate) and drop the direct next/cache import.

### friendlyDbError is copy-pasted into six actions files

Files: `lib/apex/accounts/actions.ts` · `lib/apex/budgets/actions.ts` · `lib/apex/transactions/actions.ts` · `lib/apex/subscriptions/actions.ts` · `lib/apex/mortgage/actions.ts` · `lib/spaces/actions.ts`

CONFIRMED and worse than suspected: six identical private copies, not three — accounts/actions.ts:335, budgets/actions.ts:264, transactions/actions.ts:183, subscriptions/actions.ts:127, mortgage/actions.ts:310, spaces/actions.ts:208. All are byte-identical (`message.replace(/^.*?exception:\s*/i, "")` with the same fallback sentence). A future improvement to error copy would have to land six times or drift.

**Do:** Create lib/supabase/errors.ts exporting friendlyDbError (it is used outside Apex by lib/spaces, so lib/supabase is the right home, not lib/apex), delete the six private copies, and import it in each actions file. Do not mark the new module "use server" — it is a plain utility.

### parseDay exists in lib/apex/dates.ts and as a private copy in mortgage/status.ts

Files: `lib/apex/mortgage/status.ts` · `lib/apex/dates.ts`

CONFIRMED. lib/apex/dates.ts:14 exports parseDay; lib/apex/mortgage/status.ts:182-184 re-declares an identical private parseDay (same body, near-same comment). All five mortgage cards already import parseDay from @/lib/apex/dates, so status.ts is the lone holdout. components/apex/mortgage/this-month-card.tsx:168 also inlines the same idiom as `new Date(`${today}T00:00:00`)` instead of calling parseDay.

**Do:** Delete the private parseDay from status.ts and add parseDay to its existing import list (it already imports from ./amortization; add `import { parseDay } from "@/lib/apex/dates"`). In this-month-card.tsx line 168, replace the inline `new Date(`${today}T00:00:00`)` with parseDay(today) (parseDay import already trivially available).

### Dead exports in amortization.ts: balanceSeriesWithReversion AND simulatePayoff

Files: `lib/apex/mortgage/amortization.ts`

CONFIRMED and expanded. balanceSeriesWithReversion (lines 336-354) has zero callers anywhere in app/, components/, or lib/. Additionally simulatePayoff (lines 62-83) is also dead — the what-if card uses overpaymentImpact, which calls the private `simulate`, not simulatePayoff. Two more exports are internal-only: balanceSeries (line 256) is called only by monthsToCapitalMajority in the same file, and monthlyRate (line 23) has no callers outside the file.

**Do:** Delete balanceSeriesWithReversion and simulatePayoff outright (git history keeps them). Drop the `export` keyword from balanceSeries and monthlyRate so the module's public surface states what the cards actually consume. Update the stepBalance doc comment (line 244) which name-drops balanceSeries as part of the public contract.

### lib/supabase/client.ts (createBrowserSupabase) is dead code

Files: `lib/supabase/client.ts`

CONFIRMED. createBrowserSupabase has no importers — the only grep hit is its own definition. All data access goes through createServerSupabase (server components/actions) and proxy.ts builds its own createServerClient for middleware. Client components mutate exclusively via server actions, so there is no browser Supabase path at all.

**Do:** Delete lib/supabase/client.ts. If a realtime/browser need appears later, it can be reintroduced from git history with an actual caller attached.

### currentMonth() uses UTC while every other Apex date helper uses server-local time

Files: `lib/apex/transactions/queries.ts` · `lib/apex/budgets/queries.ts` · `components/apex/due-state.tsx`

CONFIRMED. transactions/queries.ts:82-84 derives the default month filter from `new Date().toISOString().slice(0, 7)` (UTC), while todayKey() (due-state.tsx:70-74), budgets' currentMonthBounds (budgets/queries.ts:44-57), overview's lastSixMonths, and sidebar's toDateKey all use server-local parts. On a BST server between 00:00 and 00:59 local on the 1st of a month, the Transactions page defaults to the previous month while Budgets/Overview/sidebar report the new one. monthsSince (lines 269-285) also mixes getUTCFullYear/getUTCMonth into the month list for the same reason. monthEndExclusive is UTC-safe (pure y/m arithmetic) and needs no change.

**Do:** Rebuild currentMonth() from local parts — `const now = new Date(); return \`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}\`` — or, once todayKey moves to lib/apex/dates (separate finding), implement it as todayKey().slice(0, 7). Switch monthsSince's `now` reads from getUTC* to local getFullYear/getMonth to match.

### Overview card titled "This month", an explicitly rejected title pattern

Files: `components/apex/overview/cards.tsx`

components/apex/overview/cards.tsx:262 sets label="This month" on the overview budgets card. The skill's taste log rejects exactly this: 'Meaningless titles ("Your rate"), titles naming a period ("This month")', and card grammar demands 'a short noun for the subject... "Payment split", not "This month"'. The mortgage page already renamed its equivalent card to "Payment split" (components/apex/mortgage/this-month-card.tsx:52); the overview card kept the rejected title.

**Do:** In components/apex/overview/cards.tsx line 262 change label="This month" to a subject noun, e.g. label="Budgets". The existing description already carries the period ("Spent so far in {monthLabel}, biggest budgets first"), so nothing is lost.

### Budgets Headroom bar has a pace tick with no hover label (mystery pixel)

Files: `app/(shell)/apex/budgets/page.tsx`

app/(shell)/apex/budgets/page.tsx:98-105 renders DataProgress with tick={monthTick} but no tickLabel. DataProgress (components/apex/progress.tsx:57-79) only attaches a tooltip when tickLabel is passed; without it the tick renders as an unexplained vertical mark. The skill: 'every coloured region a user could point at and ask "what is that?" answers on hover'. BudgetRow (components/apex/budgets/budget-row.tsx:90) passes tickLabel={`${Math.round(tick)}% through the month`} for the same tick, so the two bars on the same page behave differently.

**Do:** Add tickLabel={`${monthTick}% through the month`} to the DataProgress call in app/(shell)/apex/budgets/page.tsx (the tick={monthTick} at line 102), matching budget-row.tsx's wording.

### Currency heroes skip the ApexStatFigure pence fade in six places

Files: `components/apex/overview/cards.tsx` · `app/(shell)/apex/subscriptions/page.tsx` · `components/apex/budgets/goal-card.tsx` · `app/(shell)/apex/budgets/page.tsx`

The skill's pence-fade rule says 'Use it [ApexStatFigure] for every currency hero.' Violations: overview/cards.tsx:393-394 (MortgageSnapshot: {formatPenceShort(status.balanceToday)} bare inside ApexStatValue — a projected balance almost always has pence); subscriptions/page.tsx:111-114, 129-132, 147-150 and 165-168 (Outgoings, Subscriptions, Bills, Next due heroes all render formatPenceShort(...) bare); goal-card.tsx:171-174 (formatPenceShort(goal.saved) bare); budgets/page.tsx:93-97 (Headroom hero `Over by £x` / `£x left` with unfaded pence). TotalBalanceCard and DueSoonCard in the same overview file do it correctly, so the pages visibly disagree.

**Do:** Wrap each formatted amount in <ApexStatFigure>{formatPenceShort(...)}</ApexStatFigure> inside its ApexStatValue. For the Headroom sentence hero, wrap only the amount portion: {over ? <>Over by <ApexStatFigure>{formatPenceShort(-headroom)}</ApexStatFigure></> : <><ApexStatFigure>{formatPenceShort(headroom)}</ApexStatFigure> left</>}.

### Account and bank cards animate without reduced-motion handling

Files: `components/apex/accounts/account-card.tsx` · `components/apex/accounts/bank-card.tsx`

account-card.tsx:57-59 (motion.div whileHover={{ y: -2 }}) and bank-card.tsx:50-52 (motion.div whileHover={{ y: -3, rotate: -0.4 }}) run house-spring hover transforms with no MotionConfig reducedMotion="user" anywhere in their tree (the only MotionConfigs in the repo are components/shell/rail.tsx:66 and components/apex/transactions/transaction-dialog.tsx:430, neither of which wraps the accounts page). docs/conventions.md: motion is 'Always inside MotionConfig reducedMotion="user"'. Mortgage's finish-track.tsx:54-55 shows the compliant pattern.

**Do:** In components/apex/accounts/accounts-view.tsx, wrap the accounts/cards sections in <MotionConfig reducedMotion="user"> from motion/react (one wrapper covers both AccountCard and BankCard), or add useReducedMotion() gates inside account-card.tsx and bank-card.tsx like finish-track.tsx does.

### Goal card formats its target date with date-fns instead of lib/apex/dates

Files: `components/apex/budgets/goal-card.tsx`

goal-card.tsx:5 imports { format } from "date-fns" and line 79 renders format(new Date(`${goal.targetOn}T00:00:00`), "MMM yyyy") → "Mar 2027". The skill: dates 'Format through lib/apex/dates', months spelled out by default, abbreviation only for table cells/tight badges/axes. The house helper formatMonthYear yields "March 2027" and already handles bad dates with the no-value dash. Also lines 370 and 79 inline parseDay's exact logic (new Date(`${key}T00:00:00`)) instead of importing parseDay.

**Do:** Replace the date-fns call with formatMonthYear(goal.targetOn) from @/lib/apex/dates (a "Target by March 2027" pill fits; if width genuinely demands the short month, add a deliberate short variant to lib/apex/dates instead of bypassing it). Use parseDay from the same module in monthsToTarget. Drop the date-fns import if nothing else needs it.

### Mark-paid error message lives only in a native title tooltip on a text button

Files: `components/apex/subscriptions/mark-paid-button.tsx`

mark-paid-button.tsx:62-70: when the server action fails, the button flips to "Retry" and the actual error string is exposed only via title={error ?? undefined} — a tooltip on text. The skill: 'Tooltips live on graphics only, never on text... If a fact exists only inside a tooltip on text, it wasn't earning its place.' On touch devices the reason is unreachable entirely. The popover branch of the same component (lines 101-105) renders the error as visible role="alert" text, so the two branches disagree.

**Do:** Remove the title attribute and surface the error as visible text next to the button (a role="alert" 13px destructive span, matching lines 101-105), or reuse the popover pattern for the error state.

### Amber instruction chip in the transactions footer misuses both the pill and the deadline colour

Files: `components/apex/transactions/transactions-table.tsx`

transactions-table.tsx:189-193 renders <DataChip color="#f59e0b">Narrow the filters to see the rest</DataChip>. Two rules broken: pills 'carry discrete data... A sentence stays a hint line' (this is an instruction sentence, not a fact), and amber means 'deadlines and windows' in the tint vocabulary — this is neither. The truncation fact is already stated by the adjacent "Showing X of Y transactions" text.

**Do:** Delete the amber DataChip and append the guidance to the existing muted sentence, e.g. "Showing 50 of 312 transactions. Narrow the filters to see the rest." as plain text-muted-foreground copy (or drop the second sentence entirely, since "Showing X of Y" already implies it).

### DueStateBadge hand-writes an amber tint that drifts from TAG_TINTS.due

Files: `components/apex/due-state.tsx`

due-state.tsx:52-58 uses "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" for the Due-today badge, while the vocabulary's TAG_TINTS.due (components/apex/anchor-tints.ts:35) is "bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300". Same semantic (deadline), two text steps — the exact per-surface drift the vocabulary file exists to prevent, and amber-600 on a 15% amber wash is weaker contrast than the ratified 800 step.

**Do:** Import TAG_TINTS from @/components/apex/anchor-tints in due-state.tsx and replace the inline classes with TAG_TINTS.due in the DueStateBadge className.


## Ticket-sized

### Add/edit container idiom is three-way split (Sheet vs Dialog vs Drawer) and two files named drawer are Sheets

Files: `components/apex/accounts/account-form-sheet.tsx` · `components/apex/accounts/card-form-sheet.tsx` · `components/apex/accounts/transfer-sheet.tsx` · `components/apex/subscriptions/recurring-drawer.tsx` · `components/apex/mortgage/mortgage-drawer.tsx` · `components/apex/budgets/goal-drawer.tsx` · `components/apex/budgets/goal-card.tsx` · `components/apex/budgets/new-budget-dialog.tsx` · `components/apex/budgets/budget-row.tsx` · `components/apex/transactions/transaction-dialog.tsx`

Entity add/edit flows use ui/sheet in accounts (3 files) and — despite their names — in recurring-drawer.tsx and mortgage-drawer.tsx (both import from @/components/ui/sheet). Budgets goals use ui/drawer (goal-drawer.tsx, TopUpDrawer in goal-card.tsx:270), a swipeable Base UI drawer with different chrome and physics for the same job. Budgets and transactions use ui/dialog. Footer furniture drifts with the split: accounts sheets use default-size buttons, recurring/mortgage use size="sm", mortgage-drawer alone adds border-t (grep `SheetFooter className`).

**Do:** Ratify the rule and converge: right-side Sheet for entity add/edit forms (migrate GoalDrawer and TopUpDrawer from ui/drawer; nothing uses drawer's swipe affordance on desktop), Dialog reserved for quick capture (transaction-dialog's amount-first design is a considered exception) and one-field edits (EditBudgetDialog, NewBudgetDialog are defensible — state this). Rename recurring-drawer.tsx/RecurringDrawer and mortgage-drawer.tsx/MortgageDrawer to ...Sheet so the name stops lying. Extract an `ApexFormSheet` scaffold (SheetContent side=right, header title/description, `flex min-h-0 flex-1 flex-col` form, scrolling body slot, FormError, footer with ghost Cancel + pending-labelled submit at one ratified button size) — five Sheets already share that exact skeleton line for line. Write the rule into the design skill.

### Hidden-input controlled Select hand-rolled in 7+ places; transaction-dialog already has the generic solution as a private component

Files: `components/apex/transactions/transaction-dialog.tsx` · `components/apex/mortgage/mortgage-drawer.tsx` · `components/apex/subscriptions/recurring-drawer.tsx` · `components/apex/budgets/goal-drawer.tsx` · `components/apex/budgets/goal-card.tsx` · `components/apex/accounts/account-form-sheet.tsx` · `components/apex/budgets/new-budget-dialog.tsx`

Because Base UI Select's own form serialization isn't relied on, every form pairs `useState` + `<input type="hidden">` + controlled Select. transaction-dialog.tsx:513-542 wraps this generically as FormSelect (with the NONE sentinel mapping); mortgage-drawer.tsx:263-286 wraps it as RateTypeField; recurring-drawer (accountId and categoryId), goal-drawer, goal-card's TopUpDrawer, account-form-sheet (kind), and new-budget-dialog all inline it. The NONE sentinel comment is itself duplicated verbatim in transaction-dialog.tsx:42-44 and recurring-drawer.tsx:43-44.

**Do:** Promote FormSelect out of transaction-dialog into a shared apex form component (components/apex/form-select.tsx or a future form.tsx), keep its documented key-remount reset contract, export the NONE sentinel from the same file, and replace the six other hand-rolls. RateTypeField collapses to a FormSelect call.

### Field wrapper (space-y-1.5 + 13px Label) hand-rolled ~45 times while components/ui/field.tsx sits entirely unused

Files: `components/ui/field.tsx` · `components/apex/mortgage/mortgage-drawer.tsx` · `components/apex/transactions/transaction-dialog.tsx` · `components/apex/accounts/account-form-sheet.tsx` · `components/apex/subscriptions/recurring-drawer.tsx` · `components/apex/budgets/goal-drawer.tsx`

`<div className="space-y-1.5"><Label className="text-[13px]">` is the de-facto field primitive in 16 files (45 hits of the Label class alone). Two files already broke and made privates: mortgage-drawer's FormField (:288-305) and transaction-dialog's FieldLabel (:544-551) — and FieldLabel drifted (`font-medium text-muted-foreground` vs bare elsewhere), so labels on the transactions dialog already look different from every other form. Meanwhile ui/field.tsx ships a full shadcn Field system that zero files import (grep `from "@/components/ui/field"` finds nothing) — dead weight sitting next to the hand-rolls it was meant to prevent.

**Do:** Pick one: (a) adopt ui/field — restyle FieldLabel to the house 13px and migrate forms to Field/FieldLabel, or (b) extract a minimal house `FormField({ label, htmlFor, hint, optional, children })` in apex and delete ui/field.tsx as unused. Given the repo's taste for small purpose-built primitives, (b) is the better call; either way resolve the transaction-dialog label drift to one label style.

### MoneyInput is shared from an awkward home while ten other money fields hand-roll a different money grammar

Files: `components/apex/accounts/account-form-sheet.tsx` · `components/apex/accounts/sync-balance-popover.tsx` · `components/apex/accounts/transfer-sheet.tsx` · `components/apex/subscriptions/recurring-drawer.tsx` · `components/apex/budgets/new-budget-dialog.tsx` · `components/apex/budgets/goal-card.tsx` · `components/apex/budgets/goal-drawer.tsx` · `components/apex/budgets/budget-row.tsx` · `components/apex/mortgage/mortgage-drawer.tsx` · `components/apex/mortgage/update-balance-popover.tsx`

MoneyInput (£-adornment input, account-form-sheet.tsx:192-201) is imported by sync-balance-popover and transfer-sheet from inside a feature sheet file — a utility living in someone else's house. Every other money field hand-rolls `<Input inputMode="decimal">` with the pound sign inside the placeholder instead ("£9.99" recurring-drawer:171, "£450" new-budget-dialog:109, "£50" goal-card:295, bare "150,000" mortgage-drawer:110), so the product has two money-entry grammars and three pence→pounds default-value conventions ((/100).toFixed(2) vs .toString() vs mortgage-drawer's pounds() that strips .00.

**Do:** Move MoneyInput to its own file (components/apex/money-input.tsx), adopt it for all decimal money fields so the £ adornment is the single grammar and placeholders go back to being examples ("9.99"), and give it (or lib/apex/money.ts) one pence→input-default helper replacing the three ad-hoc conversions.

### useActionState close-and-refresh glue duplicated in ~12 forms

Files: `components/apex/accounts/account-form-sheet.tsx` · `components/apex/accounts/card-form-sheet.tsx` · `components/apex/accounts/transfer-sheet.tsx` · `components/apex/accounts/sync-balance-popover.tsx` · `components/apex/subscriptions/recurring-drawer.tsx` · `components/apex/budgets/goal-drawer.tsx` · `components/apex/budgets/goal-card.tsx` · `components/apex/budgets/budget-row.tsx` · `components/apex/budgets/new-budget-dialog.tsx` · `components/apex/transactions/transaction-dialog.tsx` · `components/apex/mortgage/mortgage-drawer.tsx` · `components/spaces/create-space-dialog.tsx`

The same eight-line wrapper — useActionState around a server action, on `result?.success` close the container and `router.refresh()`, return result — appears in a dozen components with only the action and the close callback varying. update-balance-popover.tsx:50-57 is the one that forgot (or chose not to) refresh, which is exactly the class of drift this glue invites.

**Do:** Extract `useSaveAction(serverAction, onSuccess)` into lib/apex (client hook returning `[state, action, pending]`, calling onSuccess then router.refresh() on success). Adopt it in the twelve sites; update-balance-popover then has to state explicitly if skipping refresh is intentional. Do it alongside or after the ApexFormSheet scaffold so the forms shrink once, not twice.

### Breakdown legend row exists only in monthly-cost-card but is codified house grammar the next card will hand-roll

Files: `components/apex/mortgage/monthly-cost-card.tsx` · `components/apex/meter.tsx` · `.claude/skills/design/SKILL.md`

monthly-cost-card.tsx:81-96 hand-rolls the legend row (MeterSwatch + truncating 13px label left, 13px medium tabular amount right, justify-between) and :104-113 the total row variant (outline swatch on the hairline). The design skill (SKILL.md:94-96, 403-405) ratifies this exact grammar — "a breakdown's total row wears the legend's own grammar" — but no component owns it, unlike MeterHead/MeterSwatch which were extracted for precisely this reason ("it stopped matching the moment a second card wrote its own", meter.tsx:11-13). this-month-card.tsx:82-91 uses a different under-the-bar layout, which is deliberate and should not be forced into this shape.

**Do:** Add `MeterLegendRow({ swatchClassName, label, amount })` and a `MeterTotalRow` (or a `total` prop rendering the outline swatch + border-t) to meter.tsx, port monthly-cost-card, and reference them from the skill's section-8 table. Leave this-month-card's ends-of-bar caption alone — it is a different display, not a drifted copy.

### Query modules disagree on error handling: one throws, six swallow into empty/zero UI

Files: `lib/apex/accounts/queries.ts` · `lib/apex/budgets/queries.ts` · `lib/apex/transactions/queries.ts` · `lib/apex/subscriptions/queries.ts` · `lib/apex/overview/queries.ts` · `lib/apex/sidebar/queries.ts` · `lib/apex/mortgage/queries.ts`

CONFIRMED. getAccountsWithCards is the only query that checks its error (`if (error) throw error`, accounts/queries.ts:21). Everything else destructures `{ data }` and defaults: budgets/queries.ts:65-108 (five parallel queries), transactions/queries.ts:181 (getTransactionTotals — a failed RPC renders In £0 / Out £0 as if true) and :230 (getTransactions — error renders as an empty ledger), subscriptions/queries.ts:47-71, overview/queries.ts:70/81, sidebar/queries.ts:54-74, mortgage/queries.ts:58. For a finance app, rendering zeros on a failed read is indistinguishable from the user having no money — worse than an error page.

**Do:** Adopt the accounts policy everywhere: destructure { data, error } and `if (error) throw error` in every query in the seven files (for the .then(({data}) => …) parallel forms, throw inside the .then). Rely on the route-level error boundary to present failure honestly. One focused session; verify each Apex page still renders and that a forced error (bad column name) hits the error boundary instead of zeros.

### todayKey lives in components/apex/due-state.tsx, and the local-date-key function exists in four copies

Files: `components/apex/due-state.tsx` · `lib/apex/overview/queries.ts` · `lib/apex/sidebar/queries.ts` · `lib/apex/mortgage/actions.ts` · `lib/apex/dates.ts`

CONFIRMED and expanded. todayKey (due-state.tsx:70-74) is a pure server-clock helper imported by four route pages and the sidebar panel — it has nothing to do with the badge component it lives beside, and sits in a file that client components also import. The identical yyyy-mm-dd-from-local-Date logic is re-implemented as toDateKey in overview/queries.ts:146-149, toDateKey in sidebar/queries.ts:136-139, and serverToday in mortgage/actions.ts:304-308 — four copies of one function.

**Do:** Move todayKey into lib/apex/dates.ts and add a `dateKey(date: Date): string` sibling (todayKey = dateKey(new Date())). Delete the two private toDateKey copies and serverToday, importing from lib/apex/dates instead. Update the five todayKey import sites and .claude/skills/design/SKILL.md line 422, which documents todayKey as living in due-state.tsx.

### Client-clock violations: bank-card expiryState and goal-card paceHint/monthsToTarget

Files: `components/apex/accounts/bank-card.tsx` · `components/apex/budgets/goal-card.tsx`

CONFIRMED. Both files are "use client" and read new Date() directly: bank-card.tsx:20-29 (expiryState decides the Expired/Expires-soon pill from the browser clock) and goal-card.tsx:369-376 (monthsToTarget, feeding paceHint at 358-366 and the targetPassed pill at 82-84). This violates the documented contract in due-state.tsx and mortgage/status.ts ("pass a server-resolved today so SSR and hydration agree") — a client clock that disagrees with the server produces hydration mismatches and pills that flip depending on the visitor's device clock. Every mortgage card already does this correctly via a today prop. transaction-dialog.tsx:553-563 (localToday/localDaysAgo) also reads the client clock but only to seed a date input default, which is arguably the user's honest calendar day — noted separately, no change forced.

**Do:** Thread `today: string` (from todayKey() in the page server components) through accounts-view → BankCard and budgets page/overview → GoalCard, then compute expiryState(expiresOn, today) and monthsToTarget(targetOn, today) against parseDay(today) instead of new Date(). Verify in the running browser that the Expires-soon and Target-was pills still render.

### lib/spaces mutations have the same silent-no-op gap the Apex actions fixed

Files: `lib/spaces/actions.ts`

CONFIRMED by inspection while expanding the count-guard suspect. respondToInvite's decline branch (lines 117-124), revokeInvite (129-137), updateMemberRole (147-156), and removeMember (161-169) run update/delete with no count check; leaveSpace (181-189) is the only one guarded. updateMemberRole is the sharpest: its .neq("role", "owner") guard means attempting to reassign an owner matches zero rows and reports success. Declining an already-revoked invite, revoking an already-accepted one, and removing an already-removed member all likewise report success while writing nothing.

**Do:** Add { count: "exact" } and count===0 error returns to the four calls, with copy per case (e.g. "That invite is no longer pending.", "Owners' roles can't be changed.", "That member has already left."). Own session because each error string is user-facing copy and the invites UI needs a browser pass.

### Soft-delete stamping is implemented five times

Files: `lib/apex/accounts/actions.ts` · `lib/apex/budgets/actions.ts` · `lib/apex/transactions/actions.ts` · `lib/apex/subscriptions/actions.ts` · `lib/apex/mortgage/actions.ts`

The update({ deleted_at: new Date().toISOString(), deleted_by: user.id }).eq("id").is("deleted_at", null) idiom appears in accounts' softDelete helper (310-333, the only shared one, limited to accounts|cards), budgets' removeBudget and deleteSavingGoal, transactions' softDeleteTransaction, subscriptions' cancelRecurringPayment, and mortgage's deleteMortgage. Three of the five also repeat the auth.getUser() preamble. The two budget copies are the ones that dropped the count guard — duplication is where the pattern degraded.

**Do:** Extract one softDeleteRow(table, id, { notFound: string }) helper in lib/apex (typed over the soft-deletable table names) that stamps both columns, applies count:"exact", maps errors through friendlyDbError, and returns { error? }. Fold the five call sites onto it; keep per-caller pre-checks (deleteAccount's blocker counts, transactions' .neq kind guard via an option or a dedicated wrapper).

### data-standards.md is missing two standards the migrations now rely on: composite (id, space_id) child FKs and the update-guard trigger

Files: `docs/data-standards.md` · `supabase/migrations/20260802113000_create_apex_core.sql` · `supabase/migrations/20260804230000_update_guards.sql`

Every Apex child table FKs on composite (id, space_id) pairs against a `unique (id, space_id)` parent constraint to make cross-space references impossible — a repo-wide convention that appears nowhere in data-standards.md's "Standard table shape" or "Multi-tenancy & RLS" sections. Likewise migration 20260804230000 establishes guard_row_ownership() BEFORE UPDATE triggers (space_id and created_by immutable) after three confirmed privilege bugs from UPDATE policies written with USING and no WITH CHECK — the RLS example in data-standards.md still shows only the policy shape, and the recurring-mistake log in conventions.md has no entry for the USING-without-WITH-CHECK mistake. README.md's rule says decisions not covered by the docs must be documented.

**Do:** In its own docs PR (per README's standards-change rule): add to data-standards.md's Multi-tenancy section (a) the composite-FK rule — parents declare `unique (id, space_id)`, child FKs reference `(child_fk, space_id)` so rows cannot reference another space's data — and (b) the update-guard rule — every domain table gets the shared guard_row_ownership() BEFORE UPDATE trigger, and UPDATE policies must pair USING with an explicit WITH CHECK. Optionally add the USING-without-WITH-CHECK entry to conventions.md's recurring-mistake log dated 2026-08-04.

### todayKey (the server clock) lives in a component file, imported by every Apex page

Files: `components/apex/due-state.tsx` · `lib/apex/dates.ts` · `app/(shell)/apex/page.tsx` · `app/(shell)/apex/mortgage/page.tsx` · `app/(shell)/apex/subscriptions/page.tsx` · `app/(shell)/apex/transactions/page.tsx` · `components/apex/sidebar/panel.tsx`

todayKey() (due-state.tsx:70) is a pure date helper with no JSX, yet five server pages import their clock from a components/ file. The design skill even names it 'the server clock every card is passed', so the misplacement is documented rather than accidental, but it still breaks the stated layering rule ('data access goes through lib/ helpers') in spirit: lib/apex/dates.ts is explicitly 'the house date vocabulary' and is where an agent would look for a yyyy-mm-dd today helper. dueState() (pure logic) shares the file with DueStateBadge (UI), which is a deliberate 'one due-language' cohesion choice and defensible.

**Do:** Smallest move: relocate todayKey to lib/apex/dates.ts, update the five import sites plus due-state.tsx (which can re-export it during transition or drop it), and update the skill table rows for due-state.tsx and dates.ts. Leave dueState/DueStateBadge together as the documented one-due-language file. If the owner prefers zero code motion, the fallback is a one-line note in conventions.md that due-state.tsx intentionally co-locates the clock with the due language, but the move is cheap (6 files, mechanical) and removes a standing layering exception.

### Three surfaces hand-roll label-above-a-bar furniture instead of MeterHead

Files: `components/apex/budgets/budget-row.tsx` · `components/apex/overview/cards.tsx` · `components/apex/overview/savings-tile.tsx` · `components/apex/meter.tsx`

The skill: 'Every bar of either family takes MeterHead above it... Do not hand-roll a label-above-a-bar: two cards writing their own is how a row stops matching.' MeterHead is 11px name / 12px amount (meter.tsx:26-36). Violations, each with different furniture: budget-row.tsx:64-93 (13px medium name + 13px "£spent of £amount" + swatch dot + over-tag above DataProgress); overview/cards.tsx:286-311 MonthCard rows (13px name + muted "£x of £y" right, swatch dot, above DataProgress); savings-tile.tsx:33-47 (13px medium name + "72% saved" right above DataProgress). Three pages, three different heads over the same bar primitive.

**Do:** Extend MeterHead in components/apex/meter.tsx with optional leading (swatch dot) and trailing (tag) slots while keeping its 11px/12px type, then replace the hand-rolled head rows in budget-row.tsx, overview/cards.tsx MonthCard, and savings-tile.tsx with it. One focused session; verify all three surfaces in both themes.

### Two different money-out hues: rose in transactions/cashflow, red/destructive everywhere else

Files: `components/apex/transactions/transaction-dialog.tsx` · `components/apex/overview/cashflow-chart.tsx` · `components/apex/overview/cards.tsx` · `components/apex/anchor-tints.ts`

The vocabulary (anchor-tints.ts + skill section 4) defines destructive/red as money-bad and says 'Never pick a hue ad hoc. A genuinely new semantic extends the vocabulary file deliberately.' Rose appears ad hoc: transaction-dialog.tsx:50-51 (expense toggle: rose-500/rose-600/rose-400), cashflow-chart.tsx:29-35 (outflow bars: rose-400/rose-500) and overview/cards.tsx:209 (legend swatch bg-rose-400 dark:bg-rose-500). Meanwhile money-bad uses red-500/red-600 in mortgage (cost-ahead-card, finish-track, payoff-card) and var(--destructive) in budgets/overview over-budget states. Rose-as-"money out" (neutral spend, distinct from money-bad) may be a genuinely useful semantic — the cashflow comment defends it on CVD grounds — but it lives in three scattered files rather than the vocabulary.

**Do:** Decide the semantic in its own change: either add a documented "outflow" (rose) entry to components/apex/anchor-tints.ts with the per-theme steps the cashflow chart uses, and point transaction-dialog/cashflow-chart/overview legend at it; or converge those three sites on destructive/red. Update the skill's tint table to match whichever wins.

### Transfer's sky colour is a raw hex repeated in three places, and "sky = transfer" is not in the vocabulary

Files: `components/apex/transactions/transaction-row.tsx` · `components/apex/transactions/transactions-table.tsx` · `components/apex/anchor-tints.ts`

transaction-row.tsx:161 (avatarColor returns "#0ea5e9"), transaction-row.tsx:188 (<DataChip color="#0ea5e9">Transfer</DataChip>) and transactions-table.tsx:185 (transfer-count chip "#0ea5e9") hardcode sky-500 as hex. transaction-dialog.tsx:54-55 and transaction-row.tsx:51 use sky classes for the same semantic. The vocabulary defines sky as 'a card about committed cost: bills, interest' — transfers are neither, so this is a de facto vocabulary extension living outside anchor-tints.ts, and the hex triplication can silently drift from the class-based usages.

**Do:** Add the transfer semantic to components/apex/anchor-tints.ts (or a sibling export, e.g. TRANSFER_COLOR = "#0ea5e9" with a comment ratifying sky-for-transfer, plus tint classes), then import it at transaction-row.tsx:161, transaction-row.tsx:188 and transactions-table.tsx:185. Document the meaning in the skill's tint table in the same change.

### Card grid gap unreconciled: skill says gap-4, ApexCardGrid and two hand-written grids ship gap-3.5

Files: `components/apex/page.tsx` · `app/(shell)/apex/page.tsx` · `components/apex/accounts/accounts-view.tsx`

The skill itself flags this: 'Grids are gap-4; note ApexCardGrid still ships gap-3.5 and pages that use it inherit that, so the two want reconciling.' ApexCardGrid (components/apex/page.tsx:109) is gap-3.5; the overview page hand-writes its grid as "grid gap-3.5 lg:grid-cols-3 2xl:grid-cols-4" (app/(shell)/apex/page.tsx:59) and accounts-view.tsx:151 writes another gap-3.5 grid for bank cards.

**Do:** One small change: bump ApexCardGrid to gap-4, switch the overview page's hand-rolled grid and accounts-view's card grid to gap-4 (or better, compose ApexCardGrid with className overrides for the column spans), verify every Apex page in the browser at both themes, and delete the reconciliation caveat from the skill.


## Notes

### Runtime color-mix tint recipes drift across four chip components

Files: `components/apex/entity-avatar.tsx` · `components/apex/table-shell.tsx` · `components/apex/transactions/transaction-dialog.tsx` · `components/apex/accounts/account-card.tsx`

Four independent recipes tint UI from a data hex: EntityAvatar 16% bg / 65%-to-foreground fg, DataChip 14% / 60%, transaction-dialog CategoryChips 18% / 65%, and the account/goal card chip 14% / 75%-to-black (+dark variants). A category's color therefore renders at three subtly different strengths between the table chip, the dialog chip, and its avatar. The geometries genuinely differ, so a single component is wrong — but the mix constants could share one source.

**Do:** If it starts to grate, centralize the percentages as named constants (e.g. lib/apex/tint.ts exporting bg/fg mix helpers) and have the four components consume them. Not urgent; the duplication is small and each recipe is locally documented.

### Empty-state border drift: budgets borders its Empty, every other surface renders it bare

Files: `app/(shell)/apex/budgets/page.tsx` · `app/(shell)/apex/subscriptions/page.tsx` · `components/apex/accounts/accounts-view.tsx` · `components/apex/mortgage/mortgage-empty.tsx` · `components/apex/overview/cards.tsx`

budgets/page.tsx:75 and :135 render `<Empty className="border">`; the seven other Empty usages (subscriptions, accounts, mortgage, overview, transactions-table, shell pages) are bare. There is a defensible reading — budgets' empties sit inside ApexSections beside real cards, so the border makes them read as a surface, while the others are whole-page states — but nothing documents that rule, so the next section empty is a coin flip.

**Do:** Ratify one sentence in the design skill: bordered Empty when it stands in for a card/grid inside a section, bare when it is the page's entire body. If the team doesn't buy the distinction, drop the two `className="border"` props instead.

### Do not extract the ApexStatValue + ApexStatFigure + ApexStatUnit hero triple

Files: `components/apex/stat-card.tsx`

The hero-plus-unit composition (`<ApexStatValue><ApexStatFigure>£X</ApexStatFigure> <ApexStatUnit>a month</ApexStatUnit></ApexStatValue>`) repeats across a dozen cards and looks like an extraction target, but the variation is the point: units lead (what-if-card's "Around ... less interest"), trail, pair with tags on one line (rent-card), or invert color. A `Hero({ figure, unit })` wrapper would immediately sprout props for every one of those cases. This is composition working as designed — checked and rejected deliberately.

**Do:** None. Keep composing the primitives; resist a mega-component here.

### Identity-dot rows (colored dot + name + amount) recur but vary too much to extract yet

Files: `components/apex/overview/cards.tsx` · `components/apex/sidebar/panel.tsx` · `components/apex/budgets/budget-row.tsx` · `components/apex/budgets/new-budget-dialog.tsx`

The `size-2/2.5 rounded-full` data-colored dot beside a name and amount appears in TotalBalanceCard rows (cards.tsx:85-102), MonthCard rows (:286-303), sidebar account rows (panel.tsx:42-55), budget-row.tsx:59-63, and new-budget-dialog SelectItems (:89-93). Layouts differ meaningfully (grid cell vs SidebarMenuButton vs row-with-progress vs select item), and the dot semantic (identity swatch) is distinct from MeterSwatch (legend square, deliberately rounded-[3px]). A shared row component would be config soup; a shared `IdentityDot` would save one line per site.

**Do:** Leave as-is. Revisit only if the dot's size/shape starts drifting between surfaces — today it is consistently a rounded-full size-2/2.5 with backgroundColor from data, which is easy to keep by eye.

### recurring-drawer states its cadence options twice in one file

Files: `components/apex/subscriptions/recurring-drawer.tsx`

CADENCE_ITEMS (:46-51) feeds the Select's `items` prop while :194-197 hardcodes the same four options as SelectItem children; adding a cadence means touching both. Same file also duplicates the NONE-sentinel comment from transaction-dialog (covered by the FormSelect finding).

**Do:** Render the SelectItems by mapping `Object.entries(CADENCE_ITEMS)`; disappears entirely if the shared FormSelect ticket lands.

### Track end-label rows repeat between FinishTrack and DealMeter

Files: `components/apex/mortgage/finish-track.tsx` · `components/apex/mortgage/headline-card.tsx`

`mt-1.5 flex justify-between text-[11px] text-muted-foreground tabular-nums` closes both finish-track.tsx:143-146 and headline-card.tsx DealMeter :224-227 (and what-if-card's slider scale at :196-204 is a cousin). Two sites, four classes, both stable.

**Do:** Fine as duplication. If a third bar grows end labels, add a `MeterEnds({ start, end })` to meter.tsx alongside MeterHead.

### The 'due soon' 7-day horizon rule is computed independently in overview and sidebar

Files: `lib/apex/overview/queries.ts` · `lib/apex/sidebar/queries.ts` · `components/apex/due-state.tsx`

Overview (lines 84-86, 99-105) and sidebar (lines 42, 93-94) each hard-code the +7-day horizon and its comparison against next_due_on; dueState's actionable window (due-state.tsx:33) is a third statement of the same product rule (days <= 7). They agree today, but the number lives in three places.

**Do:** When touching either file, hoist a DUE_SOON_DAYS = 7 constant (natural home: lib/apex/subscriptions/queries.ts next to the recurring types, or the future dates module) and derive all three from it. Not worth its own session.

### Seven identical FormState type aliases

Files: `lib/apex/accounts/actions.ts` · `lib/apex/budgets/actions.ts` · `lib/apex/transactions/actions.ts` · `lib/apex/subscriptions/actions.ts` · `lib/apex/mortgage/actions.ts` · `lib/auth/actions.ts` · `lib/spaces/actions.ts`

ApexFormState, BudgetsFormState, TransactionFormState, RecurringFormState, MortgageFormState, AuthFormState, and SpaceFormState are all `{ error?: string; success?: boolean } | undefined`. Harmless duplication, but components importing the per-module name are coupled to the module rather than the shape.

**Do:** If a shared lib/form-state.ts (or the friendlyDbError module) is created anyway, export one FormState type and alias the seven to it (`export type BudgetsFormState = FormState`) so existing imports keep working. Cosmetic; batch with the friendlyDbError extraction rather than doing it alone.

### Duplicated yyyy-mm-dd validators across actions files

Files: `lib/apex/transactions/actions.ts` · `lib/apex/subscriptions/actions.ts` · `lib/apex/budgets/actions.ts` · `lib/apex/mortgage/actions.ts`

The /^\d{4}-\d{2}-\d{2}$/ day-key check appears as DATE_RE (transactions:14), inline in subscriptions (line 39), inline in budgets' parseGoalFields (251), and as parseDate in mortgage/actions (276-279). Same shape-check, four spellings; none validates that the digits form a real date, so 2026-13-99 passes all four (Postgres then rejects it with a raw error).

**Do:** When the dates consolidation ticket runs, add an exported isDayKey(value): boolean (or parseDayKey returning string|null) to lib/apex/dates.ts and use it in all four files. Optionally tighten it to reject impossible months/days so the user gets sentence-grade feedback instead of a Postgres error.

### requireContext/getWorkspace is a heavy way to resolve spaceId+userId in actions

Files: `lib/apex/budgets/actions.ts` · `lib/apex/mortgage/actions.ts` · `lib/data/workspace.ts`

budgets' requireContext (lines 10-19) and mortgage's createMortgage (line 22) call getWorkspace(), which runs profile, spaces, invites RPC, members, and (for admins) pending-invite queries — five round trips to obtain activeSpace.id and user.id. Other Apex actions take spaceId from the form instead (one auth.getUser() call), trusting RLS to reject wrong spaces; two patterns coexist for the same need.

**Do:** Add a light getActiveContext() in lib/data/workspace.ts that does auth.getUser() plus the cookie read and one spaces lookup (or reuses the RLS-validates-membership trick from setActiveSpace), and point requireContext and createMortgage at it. Decide deliberately whether form-supplied spaceId or server-resolved spaceId is the house rule — currently both exist.

### goal-card formats dates with date-fns instead of the house dates vocabulary

Files: `components/apex/budgets/goal-card.tsx` · `lib/apex/dates.ts`

goal-card.tsx imports format from date-fns (line 5) to render the target month as "MMM yyyy" (line 79), and inlines the parseDay idiom (`new Date(`${goal.targetOn}T00:00:00`)`). lib/apex/dates.ts is explicitly the house date vocabulary (formatMonthYear gives "March 2027") and documents abbreviation as a dense-surfaces-only concession; this is the only Apex surface bypassing it, and the only date-fns usage in the module.

**Do:** Replace with formatMonthYear(goal.targetOn) if the pill can afford the long month, or add a formatMonthYearShort to lib/apex/dates.ts if it cannot, and drop the date-fns import. Fold into the client-clock ticket for goal-card since the same lines are being touched.

### Three query modules export colliding option-type names with different shapes

Files: `lib/apex/budgets/queries.ts` · `lib/apex/transactions/queries.ts` · `lib/apex/subscriptions/queries.ts` · `lib/apex/overview/queries.ts`

AccountOption is {id,name,kind,balance} in budgets, {id,name,color} in transactions, {id,name} in subscriptions; CategoryOption likewise differs across budgets/transactions/subscriptions. overview/queries.ts already needs an import alias (GoalAccountOption, line 3) to hold two of them at once. The shapes genuinely differ per surface, so unification is wrong — but the shared names invite importing the wrong one and make the alias dance spread.

**Do:** Rename to surface-specific names on next touch (e.g. GoalAccountOption/TopUpAccountOption in budgets, FilterAccountOption in transactions, PayAccountOption in subscriptions), keeping deprecated aliases for one commit if needed. No dedicated session; do it opportunistically.

### board.md's frozen-archive banner is accurate — no change needed

Files: `docs/board.md`

The banner ("Linear is canonical as of 2026-08-02… statuses below are frozen at import time. Check Linear for live state") correctly frames every stale-looking status beneath it (e.g. LOS-3 "Ready", references to the long-gone lib/workspace.ts mock). Verified as intended-frozen rather than stale; per the audit brief, no edits proposed.

**Do:** Leave board.md untouched.

### foundations.md verified accurate against the foundations migrations

Files: `docs/foundations.md` · `supabase/migrations/20260802002000_create_foundations.sql` · `supabase/migrations/20260802010000_invite_notifications.sql`

Every checkable claim holds: personal space created by DB trigger at sign-up (handle_new_user + spaces_add_creator_membership), 2-owned-shared-spaces cap as a single constant (enforce_space_rules, shared_space_cap := 2), owner/admin/member/guest roles, invites defaulting to 14-day expiry with atomic accept_space_invite, in-app notification on invite to an existing user (notify_space_invite), owners not removable (delete policy requires role <> 'owner'), profiles/notifications as user-scoped exceptions, account deletion cascading owned spaces (spaces.created_by … on delete cascade).

**Do:** No change.

### conventions.md file references and mistake-log claims verified current

Files: `docs/conventions.md`

All files it names exist: components/apex/stat-card.tsx, arc-gauge.tsx, meter.tsx, components/shared/color-swatches.tsx, components/shared/meta-dot.tsx, .claude/skills/design/SKILL.md, .claude/launch.json (with the "dev" entry CLAUDE.md mentions). Its mistake-log claim that spaces' SELECT policy "still has the old shape — LIFE-30 tracks it" remains true: migration 20260802003000 kept bare `deleted_at is null` on spaces while 20260802120000 fixed only accounts/cards/categories/transactions. Apart from the board-mirror phrase flagged separately, conventions.md is current.

**Do:** No change beyond the line-43 edit in the Linear-connection finding.

### View-vocabulary .ts files under components/ are correct but the pattern is undocumented

Files: `components/apex/anchor-tints.ts` · `components/apex/accounts/meta.ts` · `docs/conventions.md`

anchor-tints.ts (Tailwind class maps) and accounts/meta.ts (lucide icons + labels + swatch hexes) are plain .ts files in components/. Their contents are view-layer (class strings, icons), so components/ is the right layer despite the extension, and the design skill documents anchor-tints. But no doc states the rule, so a tidy-minded agent could 'fix' them into lib/ (breaking the skill's documented path) or, conversely, put the next pure-logic helper in components/ citing these as precedent, which is exactly how todayKey ended up there.

**Do:** Add one sentence to conventions.md's component-architecture bullet: 'Files whose values are view vocabulary (Tailwind class maps, icon/label tables) live beside the components that consume them even as plain .ts; logic and formatting with no view dependency lives in lib/.' No file moves.

### docs/README's module-spec rule does not cover nested area specs

Files: `docs/README.md` · `docs/modules/apex/mortgage.md` · `lib/apex/mortgage/status.ts`

docs/README.md says specs live at 'docs/modules/<slug>.md', but the mortgage deep-dive lives at docs/modules/apex/mortgage.md and code cross-references it (lib/apex/mortgage/status.ts header cites 'docs/modules/apex/mortgage.md §3.1'). The cross-reference resolves, so navigation works today; the pattern is just unstated, and the next area deep-dive (e.g. budgets) has no named home.

**Do:** Extend the sentence in docs/README.md: 'Module specs live in docs/modules/<slug>.md; per-area deep-dives in docs/modules/<slug>/<area>.md.' One line, no moves.

### CLAUDE.md hard rules verified against reality: all hold

Files: `CLAUDE.md` · `lib/modules.ts` · `.claude/launch.json` · `package.json` · `AGENTS.md`

Spot-checks pass: registry-driven shell is real (only rail.tsx, context-sidebar.tsx, and app/(shell)/[module]/page.tsx import lib/modules; no hardcoded module info in shell components); zero asChild usage repo-wide (render prop everywhere, e.g. TooltipTrigger in meter.tsx and finish-track.tsx); .claude/launch.json 'dev' entry exists as CLAUDE.md claims; dev/typecheck/lint scripts match package.json; AGENTS.md exists and node_modules/next/dist/docs/ is present; lib/apex/<area>/{queries,actions}.ts holds for all five write areas with overview/sidebar correctly queries-only; components/apex/<area>/ mirrors lib/apex/<area>/ one-to-one; recent commits use conventional prefixes. The only micro-gap: CLAUDE.md's command list omits npm run format (conventions.md covers it).

**Do:** No action required; optionally add 'npm run format' to CLAUDE.md's command block for completeness. The two same-basename progress.tsx files (ui/Progress vs apex/DataProgress) are disambiguated by the skill table and need no change.

### Neutral segment colour (slate-500) is defined locally, not in the vocabulary file

Files: `components/apex/mortgage/monthly-cost-card.tsx` · `components/apex/anchor-tints.ts`

monthly-cost-card.tsx:24 defines EXTRA_COLOR = "bg-slate-500" with a comment correctly explaining why bg-muted fails on bars (polarity flips between themes). The reasoning is sound and the card passed review, but slate-as-drawn-neutral is a new segment semantic that per the skill should 'extend the vocabulary file deliberately' — the next card needing a neutral segment will either miss this constant or invent its own grey.

**Do:** When next touching the vocabulary, promote a NEUTRAL_SEGMENT (bg-slate-500) export into components/apex/anchor-tints.ts (or meter.tsx) carrying the existing comment, and have monthly-cost-card.tsx import it.

### Stale doc comments claim due dates render without ordinals ("Mon 3 Aug")

Files: `components/apex/due-state.tsx` · `app/(shell)/apex/subscriptions/page.tsx`

due-state.tsx:17 and subscriptions/page.tsx:212 both describe the beyond-a-week label as "Mon 3 Aug", but the implementation (due-state.tsx:78-80) correctly calls formatWeekdayDateShort, which keeps the ordinal ("Mon 3rd Aug"). The rendered UI is compliant; the comments teach the next agent the rejected format.

**Do:** Update both comments to read "Mon 3rd Aug".

### Bank card parses dates with raw new Date instead of parseDay

Files: `components/apex/accounts/bank-card.tsx`

bank-card.tsx:22 and 32 parse the yyyy-mm-dd expires_on with new Date(expiresOn) (UTC-midnight semantics), where lib/apex/dates exports parseDay precisely so 'month arithmetic never drifts a day'. The MM/YY display itself (line 35) is defensible as card-art typography (cards physically print MM/YY, and the bank-card is the sanctioned art exemption; the no-dark-variant pill at lines 106-107 is likewise defended in a comment since the card art is identical in both themes).

**Do:** Swap new Date(expiresOn) for parseDay(expiresOn) from @/lib/apex/dates in expiryState and formatExpiry; keep the MM/YY presentation as is.

### Cashflow legend hand-rolls its swatch instead of using MeterSwatch

Files: `components/apex/overview/cards.tsx`

CashflowLegendRow (overview/cards.tsx:234-249) draws its own aria-hidden swatch span (size-2.5 rounded-[3px]) while meter.tsx:44-51 exports MeterSwatch (size-2 rounded-[3px]) explicitly so 'legend furniture that matches across cards is what lets two meters on one page read as one system'. The Monthly cost card's legend on the mortgage page uses MeterSwatch, so the two legends are a half-pixel-class apart.

**Do:** Replace the inline span in CashflowLegendRow with <MeterSwatch className={swatchClassName} /> (accepting the size-2 standard), keeping the mt-1 alignment wrapper if needed.

### Sidebar footer's "+£x this month" is a borderline orphaned delta

Files: `components/apex/sidebar/panel.tsx`

panel.tsx:126 renders `${monthNet > 0 ? "+" : ""}${formatPenceShort(monthNet)} this month` under the "Net position" total. The copy rule: '"+£227.20" fails (than what?)'. "this month" names the period but not the subject (net of income minus spending). It reads acceptably under the Net position heading, which is why this is a note rather than a fix, but a first-time reader can take it as the change in total balance, which transfers and adjustments make untrue.

**Do:** If touching the sidebar, consider "Net +£350 this month" or a title/aria clarification tying it to income-minus-spending; verify against how monthNet is computed in lib/apex/sidebar/queries.ts before rewording.

### Budgets Headroom card has no provenance line

Files: `app/(shell)/apex/budgets/page.tsx`

app/(shell)/apex/budgets/page.tsx:88-91 renders ApexStatCard label="Headroom" with no description, while card grammar makes provenance the second element of every stat card and every other stat card audited carries one. The base hint (line 106-110, "£spent of £totalBudgeted · August") partially compensates but sits at the bottom, and "Headroom" is a term this audience may not know (memory: cards must teach the term).

**Do:** Add a description that both sources and teaches, e.g. description="What's left of your budgets this month" — and consider whether the bottom hint's month fact then belongs in it (say each fact once).

### Goal card states the passed-target fact twice

Files: `components/apex/budgets/goal-card.tsx`

When a target date has passed and the goal is unmet, goal-card.tsx renders both the neutral pill "Target was Mar 2027" (line 192) and the hint "The target date has passed." (line 363 via paceHint). The skill: 'Say each fact once per page' and a supporting line only 'where the graphic cannot speak'. The pill already carries the fact with more information (the date).

**Do:** Make paceHint return null when monthsToTarget <= 0 (the pill's targetPassed branch already covers it), deleting the "The target date has passed." sentence.

### Clean sweeps worth recording: em dashes, hard-written dots, unbuilt-behaviour claims

Files: `components/apex`

Verified clean across all of components/apex/**: (1) no em dash in user-facing copy — every "—" hit is a code comment or a sanctioned standalone no-value symbol (table cells, select placeholder at accounts/card-form-sheet.tsx:35,143, hero dashes); (2) no hard-written "·" separators in prose — the survivors are sanctioned contexts: select option label strings (accounts/transfer-sheet.tsx:65,99,122), page metadata titles, and card-number typography ("·1234" in transactions, "••••" on the bank card); (3) behaviour claims audited ("Nothing posts until you mark it paid", "We only ever keep the last four digits", "Recorded as a balance sync") all match what the actions actually do. "Both balances update instantly" (transfer-sheet.tsx:76) is true post-refresh and passes.

**Do:** No action; recorded so the next audit doesn't re-litigate these files.

