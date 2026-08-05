# Apex → Mortgage

Research synthesis and feature plan. Four research passes (domain truth, competitive
teardown, voice of the user, anti-features & upkeep) — 2026-08-05.

This doc decides what the Mortgage area is *for*, what it will contain, and — more
usefully — what it will not. Nothing here is built yet.

---

## 1. The one-paragraph version

A mortgage tracker's value is not arithmetic; every calculator in the UK already does
the arithmetic, several of them well. The value is in three questions nobody answers:
**what happens to my payment when my fix ends**, **did my overpayment actually do what
I asked**, and **how much am I still allowed to overpay this year**. All three are
dateable, personal, and unclaimed. We should build those and resist building a better
calculator.

---

## 2. What the research established

### 2.1 A mortgage is two objects, and we modelled it as one

| Layer | Lifetime | Holds |
|---|---|---|
| **The loan** | 20–40 years, one per charge | balance, term, repayment type |
| **The product** | 2–5 years, *many per loan* | rate, rate type, end date, ERC schedule, allowance |

A household keeps one loan and passes through five to ten products. Flattening both
into one row is fine for "what is true today" and wrong for "what happens next" —
which is the entire reason the area exists.

There is also **the property** (value, tenure, share owned) which belongs on its own
entity, because one property can carry more than one charge, and because sub-accounts
— one lender, one account number, several parts on different rates with different end
dates — are common enough to be a first-class concern.

### 2.2 Things we would currently get wrong

Ranked by damage. The amortisation maths was independently verified correct to the
penny — but only for a standard repayment mortgage. Correct arithmetic on a model that
cannot represent half the market.

1. **`repayment_type` does not exist.** We assume everything amortises. Interest-only
   balances never fall; the capital is due as a lump sum at term end. Our payoff card
   would show a £300k debt reaching zero in 2031 when the borrower owes all of it that
   year. ~9% of regulated mortgages, and the norm for buy-to-let.
2. **Shared-ownership LTV.** `balance ÷ (value × share)`, not `balance ÷ value`. A 40%
   share of a £300k home with a £108k mortgage is **90% LTV, not 36%** — we would tell
   someone in the worst rate band they are in the best one. We collect
   `equity_share_pct`, so we would hit this.
3. **The payoff card reports a deficit equal to the user's absence.** `simulatePayoff()`
   is a pure function of stored values compared against a fixed term end. The balance
   never moves on its own, so the projection stands still while the calendar advances.
   Three months away reads "3 months behind"; three years reads "36 months behind". It
   is a staleness counter wearing the costume of a debt problem, it invents *bad news*,
   and it punishes precisely the user this product exists for.
4. **`reversion_rate` does not exist**, so the payment-shock figure — the single most
   valuable number in the area — cannot be computed. SVR is lender-set, not `base + N`,
   and some lenders run two (Nationwide's capped BMR vs uncapped SMR, split on a 2009
   date).
5. **No ERC guardrail anywhere.** The what-if slider goes to +£500/month. On a £50k
   balance that is £1,000 past a typical 10% allowance and into a real charge.
6. **Shared-ownership monthly cost** is mortgage + rent + service charge + ground rent.
   At low share percentages the rent alone can exceed the mortgage payment.

### 2.3 Manual entry is permanent — and it does not matter

FCA Perimeter Guidance **PERG 15.3 Q16**: *"mortgage or loan accounts do not fall
within the scope of the regulations."* Open Banking covers payment accounts; a mortgage
is not one. No UK lender will ever be obliged to expose a balance. TrueLayer does not
support it, Plaid's mortgage data is US/Canada only, Emma and Snoop say so outright,
and Sprive — a funded company whose entire product is mortgage overpayment — has not
solved it. The Open Finance roadmap's nearest milestone is a discussion paper in late
2026, services around 2029.

**The reframe:** a mortgage is the most *derivable* object in personal finance. It moves
along a contractually determined line.

| Approach | Error after 12 months | Error after 60 months |
|---|---|---|
| Project forward, never ask again | £17 | **£86** |
| Store it and don't project | £4,431 | £13,912 |

*(£200,000 @ 4.5%, 25-year term.)* Projection is ~275× more accurate than storing, and
costs the user nothing. The failure modes that actually matter are structural, and they
rank: compounding convention £17 (irrelevant) · rate wrong by 0.25pp £506 · unrecorded
overpayment £2,069 (*overstates* debt — safe) · **fix ended and we weren't told, £3,000
in six months (understates debt — dangerous)**.

**Therefore: never ask for the balance again. Ask for one rate confirmation per deal,
on a date we already know.** Upkeep collapses from monthly vigilance to one prompt every
two to five years. That is a stronger version of the project's own principle — not
"re-syncing is guilt-free" but "there is nothing to re-sync."

The one thing Open Banking *does* give us: the mortgage payment leaving a connected
current account is a payment-account transaction and is readable. That detects the direct
debit, confirms the payment landed, and flags when the amount changes — the strongest
available signal that a rate has changed.

---

## 3. Jobs to be done

Ranked by how often they appeared in real user discussion.

| # | Job | Served today by anyone? |
|---|---|---|
| 1 | *Should I overpay, or save/invest instead?* | Calculators, badly — most ignore tax |
| 2 | *Reduce the term or reduce the payment?* | MSE **prescribes** an answer rather than offering the choice |
| 3 | ***Did my overpayment land, and did the lender do what I asked?*** | **Nothing. Anywhere.** |
| 4 | ***How much am I allowed to overpay this year?*** | **Nothing** — MSE explicitly declines |
| 5 | *My fix is ending — what happens and when do I act?* | Rate alerts exist; **payment shock does not** |
| 6 | *Is it worth paying the ERC to exit early?* | Nobody computes it; users can't find their own figure |
| 7 | *Will overpaying drop me a LTV band?* | Two products, both partially |
| 8 | *How much interest have I actually saved?* | Projections yes, actuals no |
| 9 | ***How much interest am I being charged, and what's the capital/interest split?*** | **Nothing.** Six reviewers across four lenders; one writes letters to find out |

Jobs 3, 4, 5 and 9 are the opportunity. Jobs 1, 2, 6, 7 are calculator work that others
do adequately.

### 3.0 The sentence that defines the area

A Skipton customer, 1★, on why a balance-only view fails:

> "It's also good at showing me the remaining balance of the mortgage but **that's not a
> fast moving milestone.** It doesn't show any indication of how much interest has been
> charged either each month or cumulative over the course of a year; a vital statistic for
> a borrowing product… **I still have to write a letter to find out how much interest I'm
> paying.**"

A static balance is not a feature. What retains people is *movement over time* — HSBC
users noticed and publicly mourned when a scroll-back balance history was removed:
*"I could scroll through and watch it reduce over time. this was very useful for tracking
your overpayments. it's lost that now."*

### 3.2 Corrected assumption

We assumed lenders don't show the fixed-rate end date. **They do** — Coventry reviewers
confirm it explicitly. The complaint is that it is shown *and nothing else is*: *"You won't
get much info with this app except the balance and expiry date of a fixed rate. Otherwise
it's useless."* So F1's value is not the date. It is the **payment shock attached to the
date**, which nobody shows.

### 3.1 The anxiety timeline

66% of UK homeowners rank the mortgage as their single biggest financial worry; 60% say
it has affected their mental health. The mechanism is **uncertainty, not the amount**.

| When | State | What defuses it |
|---|---|---|
| T−18mo | Low-grade dread, no action possible | A countdown that explicitly says **"nothing to do yet"** |
| T−6mo | Peak fear, decision paralysis | The reversion payment as a concrete number + "you can lock a rate now" |
| Decision | Shame about not understanding | Few choices; never require fluency |
| After overpaying | Distrust — "did that work?" | Confirmation the money landed and what it bought |

**A red countdown attached to no available action is an avoidance trigger, not a
motivator.** The T−18mo state must be calm.

---

## 4. Feature plan

### 4.1 Build

**F1 · The fix-end card.** The headline feature and the biggest gap in the market. Four
things, nothing else:
- Countdown to the product end date, in the primary numeral slot.
- **The payment shock as the headline:** current payment vs modelled payment on the
  lender's SVR. Lead with the delta — *"+£412 a month · +£4,944 a year."* No product
  shows this.
- **The arm-yourself marker:** a band at end-date minus six months, *"you can lock a new
  deal from 14 Sept"*, citing the Mortgage Charter so it reads as a right. ~75% of
  borrowers do a product transfer rather than remortgage, so "ask your lender first"
  is the default path, not the fallback.
- **LTV band proximity as the one action available now**: current LTV, next band down,
  and the overpayment needed to cross it. Crossing 80%→75% on £200k is worth ~£36/month.

`rate-card.tsx`'s existing "alarm inversion" at six months — where the countdown replaces
the rate as the headline — is the best thing in the current module and should survive.

**F2 · Reconciliation.** The unclaimed trust job, and the one thing a tracker can do that
a calculator cannot. We already own transaction data. Show planned vs actual: *"you
planned £200/month, you've averaged £164, your free date moved from June 2039 to November
2040."* Vertex42's spreadsheet ships a **second worksheet** purely for payments actually
made — someone built that because a projection alone wasn't enough.

**F3 · Allowance headroom.** How much is left this allowance year, on this lender's rules,
with the reset date. Store the basis (original advance vs outstanding balance — Nationwide
and most other lenders differ, and it's £20k vs £15k of headroom on a £200k/£150k
mortgage) and the year type. **Default conservatively to outstanding, prompt the user to
check their offer, never guess silently.**

**F4 · The ghost schedule.** One balance-over-time chart, two series. Contractual
amortisation as a dashed low-contrast ghost; actual-then-projected as the solid accent
line. Two annotations do all the work: the **horizontal gap** where both reach zero is
the time saved; the **shaded area between them** is the money saved. This resolves the
interest-saved-vs-time-saved question by refusing it — one picture, no toggle. Once the
actual series exists it doubles as F2.

**F5 · Quantised progress, replacing the percentage bar.** A grid of discrete cells, sized
so **one ordinary monthly payment fills roughly one cell** (~300 on a 25-year term). A
continuous bar moving 2% a year is visually motionless — a monthly reminder that nothing
is happening. Twelve cells lighting up over a year is not. Track the balance *descending
to zero*, not payments accumulated. Give cells the contractual schedule alone would have
filled a distinct outline — that comparison is what converts "I'm paying my mortgage" into
"I'm ahead." Add a **this-year view**, because a 25-year grid is a wall of unfilled squares.

We already have `ProgressGrid` for savings goals. Same idea, direct reuse.

**F6 · Overpayment modelling, honestly.** Keep the what-if; fix the number.
- Round hard. £36,281 becomes "around £36,000" — the same input across a plausible rate
  band swings the answer 7× (£19k at 3.5% to £134k at 6%), and precision implies a
  confidence the model cannot support.
- State the assumption on the card: *"if this rate held."*
- Gate the slider on F3's allowance.
- **Always show both numbers, adjacent.** This is the strongest consensus in the entire
  study — every tool that models overpayments shows interest saved *and* time saved, and
  none makes you choose. Lead with time, put money beneath: **time is the hook, money is
  the proof.**

**F8 · Interest charged, and the capital/interest split.** The highest-confidence unmet
need in the entire study — six independent reviewers across four lenders, none satisfied,
one reduced to writing letters. No UK lender app in an 8,900-review corpus does it well.
Three numbers: interest charged this month, interest charged this year, and the
capital-vs-interest split of the current payment. All three are derivable from data we
already hold. This is also the answer to *"my balance barely moved and I don't know why"*,
which is the emotional core of the annual-statement shock.

**F9 · Joint mortgages, properly.** Every incumbent fails this. Sprive cannot handle two
people on one mortgage — *"If our joint account is good enough to take payments from, why
do I need to create a separate bank account?… It's a JOINT ACCOUNT!"* — and users
explicitly ask for *"a shared or linked account view showing combined progress, total
overpayments, and joint goals."* **Life OS already has spaces and multi-user membership.**
This is a structural advantage we get for free and the incumbents cannot easily retrofit.
Household pricing is separately an explicit unmet demand from Emma's paying users.

**F8 · Interest charged, and the capital/interest split.** The highest-confidence unmet
need in the whole study — six independent reviewers across four lenders, none satisfied,
one reduced to writing letters to his building society to find out. No UK lender app in
the sampled corpus does it. Two figures: *this month, £X killed debt and £Y fed the bank*,
and *interest charged this year to date*. Both fall straight out of the schedule we
already compute. This is also the answer to "balance isn't a fast moving milestone" — it
is the number that moves.

**F9 · Joint mortgages, which are broken everywhere.** Sprive cannot handle two people on
one mortgage: *"the app won't let my husband send payments"*, *"It's a JOINT ACCOUNT!"*,
*"I have money sitting doing nothing on the app and have given up using the app."* Life OS
already has spaces and multi-user membership, so a shared view of one mortgage with
combined progress is close to free for us and is a genuine structural advantage over every
incumbent. Household pricing is separately an explicit unmet demand from Emma's paying
users.

**F7 · Data model corrections.** `repayment_type`, `balance_as_of`, `reversion_rate`,
`rate_started_on`, `term_started_on`, `property_id`, `erc_schedule`,
`overpayment_allowance_pct`. Move `equity_share_pct` and `rent_monthly` to property
metadata (~1–2% of rows — textbook 80%-rule violations at top level). Service charge and
ground rent become recurring bills in the ledger, where they belong.

**Infer `repayment_type` from the payment** rather than asking: if `payment ≈ balance ×
rate ÷ 12` it's interest-only, materially higher means repayment. The most important
missing field costs zero extra questions. The same divergence check catches sub-accounts —
when stated and calculated payments disagree, ask why, and discover split rates without
ever asking about split rates.

### 4.2 Maybe — needs a decision

- **Overpay vs save**, done properly: compare against the **post-tax** savings rate using
  the user's band and Personal Savings Allowance. Received wisdom ("always overpay") is
  now often wrong. Risk: strays toward investment advice if extended to ISAs/pensions.
- **ERC net-of-cost exit modelling** — *"paying the £8.2k ERC and moving is equivalent to
  a rate of 4.7%."* Genuinely useful, genuinely hard, and users cannot even find their own
  ERC figure today.
- **Redemption figure.** On every annual statement, in no app. Cheap.
- **Payment-detection via Open Banking** — confirm the direct debit landed and flag when
  the amount changes.

### 4.3 Explicitly not building

1. **A full amortisation schedule.** Lenders already send a legally mandated annual
   statement containing exactly this; it influences 3–7% of switching decisions — the
   lowest-scoring prompt measured. Ship two rows: this month's capital/interest split, and
   the balance at the next rate change.
2. **Any streak, badge, points or celebration mechanic.** The FCA has published research
   treating this cluster as consumer harm in a financial context, with ~1 in 27 users
   showing problem-gambling behaviour. 81% of UK adults avoid talking about money (91%
   among those with mental-health difficulty). Mortgage debt is the worst possible
   substrate.
3. **"Keep your data fresh" nudges.** The correct answer to staleness is to make staleness
   not matter — achievable to within £86 over five years. A nudge to re-enter a derivable
   number outsources the app's own arithmetic to someone with executive-function difficulty.
4. **A net-worth or equity chart driven by `property_value`.** The field is collected,
   stored, typed through queries and actions, and rendered by **nothing** — the
   highest-decay field in the schema with zero output. Delete it rather than build the
   card it was meant to feed.
5. **Any lender comparison, product ranking, or "you should switch" recommendation.**
   Perimeter risk, and 57% of movers already use a broker. Deliver the user to a broker at
   the right moment with their numbers in hand — that's scheduling, not advice.
6. **A second notification channel.** One alert: the rate-end countdown. 72% of fintech
   users have muted or uninstalled over notification volume; the FCA named frequent
   notifications as a harmful design feature. Every addition dilutes the one that matters.
7. **Dual-axis or compound-curve interest visualisations.** Unsynchronised dual axes
   manufacture apparent relationships, and a compounding curve flatters the overpayment
   case beyond what rate uncertainty supports.
8. **Confident payoff dates.** Month precision on a 25-year projection built from a
   two-year rate is still false confidence, just quieter. Bound it to the rate horizon
   — *"on this rate, ~2043"* — or show only the delta the user can influence.
9. **Anything commercial inside the mortgage view.** The most viscerally resented pattern
   found, confirmed across iOS, Play and Trustpilot: *"I hate the 'We've detected a change
   in your mortgage' pop up that gets in the way EVERY SINGLE TIME… I know the app gets
   their money from mortgage referrals, but it's bordering on the needy!"* And at a lender:
   *"your app is a user experience, not marketing real estate."*

**Two design requirements that fall out of the review mining:**

- **Fail loudly.** A connection or figure that goes stale *silently* destroyed trust in
  every other number for Moneyhub's most loyal reviewer. Staleness must be visible.
- **Design for the product-transfer event.** Remortgaging — the single most common mortgage
  life event, on a 2–5 year cycle — orphaned Sprive accounts badly enough that users
  deleted them. Changing deal must be a first-class flow, not an edit.

---

## 5. Positions taken on contested ground

**Term vs payment — the received wisdom is subtly wrong.** With daily interest, reducing
the term and reducing the payment save *identical* interest **for the same total
cashflow**. The difference is that reduce-payment hands you the option to pay less, and
most people take it — so in practice it saves less. It is a **commitment device, not a
maths difference.** MSE's calculator instructing users to always shorten the term is
overstating its case; the forum's counter-argument (keeping the longer term preserves the
right to drop back with no repercussion) is the better one. Frame it as flexibility vs
commitment, show both outcomes, don't prescribe.

**Overpay vs save.** Compare post-tax, using the user's band and PSA. Never hardcode
"overpaying is good."

**LTV bands.** Say plainly when overpaying *won't* change the band — below ~60% it stops
mattering entirely. One forum user cancelled a planned overpayment on learning this, which
is a genuinely valuable outcome.

**The psychological-vs-optimal fight**, which is a direct challenge to this product's
premise:

> "The idea of it being better to see the mortgage balance going down is purely
> psychological, and one you will pay dearly for."

> "If you know you can't save money, def overpay your mortgage. No point talking about how
> saving and paying a lumpsum is great, when it doesn't work for you."

The optimiser is right about the arithmetic and wrong about the human. **Show the optimal
answer honestly, let the user choose the achievable one, never moralise about the gap.**
Same principle as budgets' "visible but calm, not shaming."

**One place where the delightful thing and the correct thing diverge.** Goal-progress
research finds people direct money at the debt they can *close* rather than the one that
costs most, and the distortion is worse with windfall money. A satisfying mortgage payoff
visual sitting next to an untouched 24% credit card is actively harmful. **F5 must be
gated behind, or annotated with, the user's other debts.**

---

## 6. The strategic point

Every product that does mortgages *well* is funded by broker commission, cashback margin,
or lead generation — which means its numbers are shaped to produce a lead. Sprive, Theo
and Tembo all ship "market rate alerts", which is a broker-lead trigger dressed as a
tracker feature. Meanwhile UK consumer PFM does not monetise mortgages at all: Emma is
manual and Pro-only, Snoop has nothing, Moneyhub went B2B, Money Dashboard closed 16
months after acquisition, Copilot auto-values the house and ignores the loan.

Life OS has no such pressure. **We can afford to show the number that is true rather than
the number that converts** — including "do nothing, your lender's product transfer is
fine." That should be designed for explicitly, not left implicit.

---

## 7. Research gaps

Stated so they aren't mistaken for findings:

- **No product screens were seen.** The teardown is built from marketing pages, help docs
  and third-party articles. Sprive's and Theo's more interesting claims are vendor
  self-description.
- **Reddit was unreachable** — r/UKPersonalFinance, r/HousingUK, r/FIREUK all blocked. The
  FIRE-flavoured overpay-vs-invest angle is under-sampled. MSE forums carried the load.
- **Three dead products unresearched** — Mint, Money Dashboard, Trussle. Failure modes
  matter more than feature lists; this is the biggest remaining gap.
- **UK lender in-app mortgage screens** (Nationwide, Halifax, Barclays) all returned
  403/404. That is the baseline users actually compare against, and one forum quote — *"only
  the contractual end date is shown online"* — suggests it is very thin.
- **The regulatory deep-dive** on PERG 4/8 and the advice boundary did not complete. §4.3
  item 5 is directionally right but should be re-read against it before building anything
  near the line.

---

## 8. Open questions

1. Manual entry is settled as permanent — does the projection-first model in §2.3 get
   adopted as the area's core principle?
2. How close to the advice boundary do we sit? §4.2's overpay-vs-save is the test case.
3. Free or paid — does it change what we're willing to show?
4. Are area toggles a real feature? Mortgage is genuinely standalone, so it's the easy
   case; Subscriptions hard-depends on Accounts.
5. Build order. F1 (fix-end card) has the highest value and no dependencies. F7 (data
   model) unblocks F2, F4 and F5 and should probably go first regardless.
